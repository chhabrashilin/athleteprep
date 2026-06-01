/**
 * lib/analysis/generate-report.ts — Full analysis pipeline orchestrator.
 *
 * Coordinates: auth check → input snapshot → readiness check →
 *   analysis job → AI generation (real or mock) → normalization →
 *   report persistence → job completion.
 *
 * This is the single entry point for report generation. Call it from a
 * server action or route handler; never call it from client components.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildAnalysisInputSnapshot } from "@/lib/analysis/build-input-snapshot";
import { getAnalysisReadiness } from "@/lib/analysis/readiness";
import { generateGameReport } from "@/lib/ai/generate-game-report";
import { getAIProviderConfig } from "@/lib/ai/provider-factory";
import {
  createAnalysisJob,
  markAnalysisJobRunning,
  markAnalysisJobCompleted,
  markAnalysisJobFailed,
  setAnalysisJobInputSnapshot,
  getLatestAnalysisJobForGame,
} from "@/lib/db/analysis-jobs";
import {
  setPreviousReportsNotCurrent,
  getReportVersionNumber,
  createGameReportWithDetails,
} from "@/lib/db/reports";
import type { GenerateReportResult, GenerateReportError } from "@/types/analysis";

const STAFF_ROLES = ["owner", "coach", "analyst"];

/**
 * Runs the full analysis pipeline for a game.
 *
 * Steps:
 *  1. Verify auth + team membership + permission
 *  2. Check for already-running job (prevent duplicates)
 *  3. Build input snapshot from DB
 *  4. Evaluate readiness
 *  5. Resolve AI provider config (mock / openai / anthropic / gemini)
 *  6. Create analysis_jobs row with provider + model metadata
 *  7. Store input snapshot on job
 *  8. Mark job running
 *  9. Run AI generator (async, with normalization + validation)
 * 10. Mark previous reports not current
 * 11. Get next version number
 * 12. Insert game_reports + all child records
 * 13. Store output snapshot (with provider metadata) on job
 * 14. Mark job completed
 * 15. Update game status to "analyzed"
 * 16. Return success with reportId + jobId
 *
 * On any failure: mark job failed (with error message), return error.
 */
export async function generateReportForGame(
  teamId: string,
  gameId: string
): Promise<GenerateReportResult | GenerateReportError> {
  let jobId: string | undefined;

  try {
    // ── 1. Auth and permission check ──────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Database is not configured." };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "You must be signed in to generate a report." };
    }

    const { data: memberData, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return { success: false, error: "You are not a member of this team." };
    }

    const role = memberData.role as string;
    if (!STAFF_ROLES.includes(role)) {
      return { success: false, error: "Only owners, coaches, and analysts can generate reports." };
    }

    // ── 2. Check for already-running job ─────────────────────────────────
    const latestJob = await getLatestAnalysisJobForGame(teamId, gameId);
    if (latestJob?.status === "running" || latestJob?.status === "pending") {
      return {
        success: false,
        error: "An analysis is already in progress. Please wait for it to complete.",
        jobId: latestJob.id,
      };
    }

    // ── 3. Build input snapshot ───────────────────────────────────────────
    const snapshot = await buildAnalysisInputSnapshot(teamId, gameId);

    // ── 4. Readiness check ────────────────────────────────────────────────
    const readiness = getAnalysisReadiness(snapshot);
    if (!readiness.canGenerate) {
      return {
        success: false,
        error: readiness.reasons.join(" ") || "Insufficient data to generate a report.",
      };
    }

    // ── 5. Resolve provider config ────────────────────────────────────────
    const providerConfig = getAIProviderConfig();

    // ── 6. Create analysis job with provider metadata ─────────────────────
    const job = await createAnalysisJob({
      teamId,
      gameId,
      provider: providerConfig.provider,
      modelName: providerConfig.model,
    });
    jobId = job.id;

    // ── 7. Store input snapshot on job ────────────────────────────────────
    await setAnalysisJobInputSnapshot(jobId, snapshot as unknown as Record<string, unknown>);

    // ── 8. Mark job running ───────────────────────────────────────────────
    await markAnalysisJobRunning(jobId);

    // ── 9. Run AI generator (async, validated, normalized) ────────────────
    let generationResult;
    try {
      generationResult = await generateGameReport(snapshot);
    } catch (aiErr) {
      const message =
        aiErr instanceof Error
          ? aiErr.message
          : "Report generation failed — the AI provider returned an unexpected response.";
      throw new Error(message);
    }

    const { normalizedReport: generated, providerResult, normalizationWarnings } = generationResult;

    // ── 10. Mark previous reports not current ─────────────────────────────
    await setPreviousReportsNotCurrent(teamId, gameId);

    // ── 11. Get next report version ───────────────────────────────────────
    const version = await getReportVersionNumber(teamId, gameId);

    // ── 12. Insert report + child records ─────────────────────────────────
    const rawAiOutput: Record<string, unknown> = {
      ...(generated as unknown as Record<string, unknown>),
      _meta: {
        provider: providerConfig.provider,
        model: providerConfig.model,
        generatedAt: new Date().toISOString(),
        usage: providerResult.usage ?? null,
        normalizationWarnings: normalizationWarnings.length > 0 ? normalizationWarnings : undefined,
      },
    };

    const report = await createGameReportWithDetails({
      teamId,
      gameId,
      analysisJobId: jobId,
      version,
      generated,
      rawAiOutput,
    });

    // ── 13. Store output snapshot on job ──────────────────────────────────
    const outputSnapshot: Record<string, unknown> = {
      reportId: report.id,
      version,
      provider: providerConfig.provider,
      model: providerConfig.model,
      insightCount: generated.coachingInsights.length,
      playerReportCount: generated.playerReports.length,
      practiceRecCount: generated.practiceRecommendations.length,
      opponentTendencyCount: generated.opponentTendencies.length,
      overallConfidence: generated.overallConfidence,
    };

    if (providerResult.usage) {
      outputSnapshot.usage = providerResult.usage;
    }
    if (normalizationWarnings.length > 0) {
      outputSnapshot.normalizationWarnings = normalizationWarnings;
    }

    await markAnalysisJobCompleted(jobId, outputSnapshot);

    // ── 14. Update game status to analyzed ────────────────────────────────
    try {
      await supabase
        .from("games")
        .update({ status: "analyzed" })
        .eq("id", gameId)
        .eq("team_id", teamId);
    } catch {
      console.error("Failed to update game status to analyzed — non-fatal");
    }

    return {
      success: true,
      reportId: report.id,
      jobId,
      version,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report generation failed.";
    console.error("generateReportForGame error:", message);

    if (jobId) {
      await markAnalysisJobFailed(jobId, message).catch((e) =>
        console.error("Failed to mark job as failed:", e)
      );
    }

    return { success: false, error: message, jobId };
  }
}
