/**
 * lib/db/report-editing.ts — Functions that let authorized coaches edit
 * AI-generated report content while preserving the original AI output.
 *
 * Permissions: owner / coach / analyst only.
 * Behavior:
 *   1. First edit: snapshot current fields into original_ai_content.
 *   2. Apply edits, set is_edited = true, verification_status = 'edited'.
 *   3. Insert a verification_feedback row for audit trail.
 *   4. Never overwrite original_ai_content on subsequent edits.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CoachingInsight,
  PlayerReport,
  PracticeRecommendation,
  OpponentTendency,
  GameReport,
  EvidenceItem,
  PlayerKeyMoment,
} from "@/types/database";
import type { ConfidenceLevel, VerificationStatus } from "@/types/core";
import type {
  UpdateCoachingInsightInput,
  UpdatePlayerReportInput,
  UpdatePracticeRecommendationInput,
  UpdateOpponentTendencyInput,
  UpdateGameReportSummaryInput,
} from "@/types/verification";

const STAFF_ROLES = ["owner", "coach", "analyst"];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function assertStaff(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  teamId: string,
  userId: string
): Promise<void> {
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (!membership || !STAFF_ROLES.includes(membership.role as string)) {
    throw new Error("You do not have permission to edit report content.");
  }
}

async function insertFeedbackRow(
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>,
  params: {
    teamId: string;
    gameId: string;
    gameReportId: string;
    targetType: string;
    targetId: string;
    submittedBy: string;
    correctionText?: string;
  }
): Promise<void> {
  await supabase.from("verification_feedback").insert({
    team_id: params.teamId,
    game_id: params.gameId,
    game_report_id: params.gameReportId,
    submitted_by: params.submittedBy,
    target_type: params.targetType,
    target_id: params.targetId,
    verification_status: "edited",
    correction_text: params.correctionText ?? null,
    metadata: {},
  });
}

// ---------------------------------------------------------------------------
// Update coaching insight
// ---------------------------------------------------------------------------

export async function updateCoachingInsight(
  input: UpdateCoachingInsightInput
): Promise<CoachingInsight> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  await assertStaff(supabase, input.teamId, user.id);

  const { data: current, error: fetchErr } = await supabase
    .from("coaching_insights")
    .select("*")
    .eq("id", input.insightId)
    .eq("team_id", input.teamId)
    .single();

  if (fetchErr || !current) throw new Error("Coaching insight not found.");

  const isFirstEdit = !current.original_ai_content;
  const originalAiContent = isFirstEdit
    ? {
        title: current.title,
        summary: current.summary,
        why_it_matters: current.why_it_matters,
        recommended_action: current.recommended_action,
        assumptions: current.assumptions,
      }
    : (current.original_ai_content as Record<string, unknown>);

  const { data: updated, error: updateErr } = await supabase
    .from("coaching_insights")
    .update({
      title: input.title,
      summary: input.summary,
      why_it_matters: input.whyItMatters,
      recommended_action: input.recommendedAction,
      assumptions: input.assumptions,
      is_edited: true,
      verification_status: "edited",
      original_ai_content: originalAiContent,
    })
    .eq("id", input.insightId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message ?? "Failed to update coaching insight.");
  }

  await insertFeedbackRow(supabase, {
    teamId: input.teamId,
    gameId: input.gameId,
    gameReportId: input.gameReportId,
    targetType: "coaching_insight",
    targetId: input.insightId,
    submittedBy: user.id,
    correctionText: input.correctionText,
  });

  return rowToCoachingInsight(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Update player report
// ---------------------------------------------------------------------------

export async function updatePlayerReport(
  input: UpdatePlayerReportInput
): Promise<PlayerReport> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  await assertStaff(supabase, input.teamId, user.id);

  const { data: current, error: fetchErr } = await supabase
    .from("player_reports")
    .select("*")
    .eq("id", input.reportId)
    .eq("team_id", input.teamId)
    .single();

  if (fetchErr || !current) throw new Error("Player report not found.");

  const isFirstEdit = !current.original_ai_content;
  const originalAiContent = isFirstEdit
    ? {
        summary: current.summary,
        strengths: current.strengths,
        improvement_areas: current.improvement_areas,
        recommended_focus: current.recommended_focus,
        player_facing_summary: current.player_facing_summary,
      }
    : (current.original_ai_content as Record<string, unknown>);

  const { data: updated, error: updateErr } = await supabase
    .from("player_reports")
    .update({
      summary: input.summary,
      strengths: input.strengths,
      improvement_areas: input.improvementAreas,
      recommended_focus: input.recommendedFocus,
      player_facing_summary: input.playerFacingSummary,
      is_edited: true,
      verification_status: "edited",
      original_ai_content: originalAiContent,
    })
    .eq("id", input.reportId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message ?? "Failed to update player report.");
  }

  await insertFeedbackRow(supabase, {
    teamId: input.teamId,
    gameId: input.gameId,
    gameReportId: input.gameReportId,
    targetType: "player_report",
    targetId: input.reportId,
    submittedBy: user.id,
    correctionText: input.correctionText,
  });

  return rowToPlayerReport(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Update practice recommendation
// ---------------------------------------------------------------------------

export async function updatePracticeRecommendation(
  input: UpdatePracticeRecommendationInput
): Promise<PracticeRecommendation> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  await assertStaff(supabase, input.teamId, user.id);

  const { data: current, error: fetchErr } = await supabase
    .from("practice_recommendations")
    .select("*")
    .eq("id", input.recommendationId)
    .eq("team_id", input.teamId)
    .single();

  if (fetchErr || !current) throw new Error("Practice recommendation not found.");

  const isFirstEdit = !current.original_ai_content;
  const originalAiContent = isFirstEdit
    ? {
        title: current.title,
        description: current.description,
        drill_name: current.drill_name,
        duration_minutes: current.duration_minutes,
        coaching_points: current.coaching_points,
      }
    : (current.original_ai_content as Record<string, unknown>);

  const { data: updated, error: updateErr } = await supabase
    .from("practice_recommendations")
    .update({
      title: input.title,
      description: input.description,
      drill_name: input.drillName,
      duration_minutes: input.durationMinutes,
      coaching_points: input.coachingPoints,
      is_edited: true,
      verification_status: "edited",
      original_ai_content: originalAiContent,
    })
    .eq("id", input.recommendationId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message ?? "Failed to update practice recommendation.");
  }

  await insertFeedbackRow(supabase, {
    teamId: input.teamId,
    gameId: input.gameId,
    gameReportId: input.gameReportId,
    targetType: "practice_recommendation",
    targetId: input.recommendationId,
    submittedBy: user.id,
    correctionText: input.correctionText,
  });

  return rowToPracticeRecommendation(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Update opponent tendency
// ---------------------------------------------------------------------------

export async function updateOpponentTendency(
  input: UpdateOpponentTendencyInput
): Promise<OpponentTendency> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  await assertStaff(supabase, input.teamId, user.id);

  const { data: current, error: fetchErr } = await supabase
    .from("opponent_tendencies")
    .select("*")
    .eq("id", input.tendencyId)
    .eq("team_id", input.teamId)
    .single();

  if (fetchErr || !current) throw new Error("Opponent tendency not found.");

  const isFirstEdit = !current.original_ai_content;
  const originalAiContent = isFirstEdit
    ? {
        title: current.title,
        description: current.description,
        recommended_response: current.recommended_response,
        tags: current.tags,
      }
    : (current.original_ai_content as Record<string, unknown>);

  const { data: updated, error: updateErr } = await supabase
    .from("opponent_tendencies")
    .update({
      title: input.title,
      description: input.description,
      recommended_response: input.recommendedResponse,
      tags: input.tags,
      is_edited: true,
      verification_status: "edited",
      original_ai_content: originalAiContent,
    })
    .eq("id", input.tendencyId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message ?? "Failed to update opponent tendency.");
  }

  await insertFeedbackRow(supabase, {
    teamId: input.teamId,
    gameId: input.gameId,
    gameReportId: input.gameReportId,
    targetType: "opponent_tendency",
    targetId: input.tendencyId,
    submittedBy: user.id,
    correctionText: input.correctionText,
  });

  return rowToOpponentTendency(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Update game report summary
// ---------------------------------------------------------------------------

export async function updateGameReportSummary(
  input: UpdateGameReportSummaryInput
): Promise<GameReport> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  await assertStaff(supabase, input.teamId, user.id);

  const { data: current, error: fetchErr } = await supabase
    .from("game_reports")
    .select("*")
    .eq("id", input.reportId)
    .eq("team_id", input.teamId)
    .single();

  if (fetchErr || !current) throw new Error("Game report not found.");

  // Preserve original in edited_output.originalAiSummary if not already set
  const existingEdited = (current.edited_output as Record<string, unknown> | null) ?? {};
  const editedOutput: Record<string, unknown> = {
    ...existingEdited,
    title: input.title,
    executiveSummary: input.executiveSummary,
    assumptions: input.assumptions,
    limitations: input.limitations,
  };

  // Store original values once
  if (!existingEdited.originalAiSummary) {
    editedOutput.originalAiSummary = {
      title: current.title,
      executiveSummary: current.executive_summary,
      assumptions: current.assumptions,
      limitations: current.limitations,
    };
  } else {
    editedOutput.originalAiSummary = existingEdited.originalAiSummary;
  }

  const { data: updated, error: updateErr } = await supabase
    .from("game_reports")
    .update({
      title: input.title,
      executive_summary: input.executiveSummary,
      assumptions: input.assumptions,
      limitations: input.limitations,
      edited_output: editedOutput,
    })
    .eq("id", input.reportId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error(updateErr?.message ?? "Failed to update game report summary.");
  }

  // Insert verification feedback with game_report target type
  await supabase.from("verification_feedback").insert({
    team_id: input.teamId,
    game_id: input.gameId,
    game_report_id: input.reportId,
    submitted_by: user.id,
    target_type: "game_report",
    target_id: input.reportId,
    verification_status: "edited",
    correction_text: input.correctionText ?? null,
    metadata: {},
  });

  return rowToGameReport(updated as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Row transforms (duplicated here to keep this file self-contained)
// ---------------------------------------------------------------------------

function rowToGameReport(row: Record<string, unknown>): GameReport {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    analysisJobId: (row.analysis_job_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    title: row.title as string,
    executiveSummary: (row.executive_summary as string | null) ?? null,
    overallConfidence: (row.overall_confidence as ConfidenceLevel) ?? "medium",
    reportVersion: (row.report_version as number) ?? 1,
    isCurrent: (row.is_current as boolean) ?? true,
    aiGenerated: (row.ai_generated as boolean) ?? true,
    rawAiOutput: (row.raw_ai_output as Record<string, unknown>) ?? {},
    editedOutput: (row.edited_output as Record<string, unknown> | null) ?? null,
    assumptions: (row.assumptions as string[]) ?? [],
    limitations: (row.limitations as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCoachingInsight(row: Record<string, unknown>): CoachingInsight {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    gameReportId: row.game_report_id as string,
    title: row.title as string,
    summary: row.summary as string,
    whyItMatters: (row.why_it_matters as string | null) ?? null,
    recommendedAction: (row.recommended_action as string | null) ?? null,
    confidence: (row.confidence as ConfidenceLevel) ?? "medium",
    verificationStatus: (row.verification_status as VerificationStatus) ?? "edited",
    evidence: (row.evidence as EvidenceItem[]) ?? [],
    assumptions: (row.assumptions as string[]) ?? [],
    affectedPlayerIds: (row.affected_player_ids as string[]) ?? [],
    relatedEventIds: (row.related_event_ids as string[]) ?? [],
    sortOrder: (row.sort_order as number) ?? 0,
    isEdited: (row.is_edited as boolean) ?? true,
    originalAiContent: (row.original_ai_content as Record<string, unknown> | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPlayerReport(row: Record<string, unknown>): PlayerReport {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    gameReportId: row.game_report_id as string,
    playerId: (row.player_id as string | null) ?? null,
    playerDisplayName: (row.player_display_name as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    strengths: (row.strengths as string[]) ?? [],
    improvementAreas: (row.improvement_areas as string[]) ?? [],
    keyMoments: (row.key_moments as PlayerKeyMoment[]) ?? [],
    recommendedFocus: (row.recommended_focus as string | null) ?? null,
    playerFacingSummary: (row.player_facing_summary as string | null) ?? null,
    confidence: (row.confidence as ConfidenceLevel) ?? "medium",
    verificationStatus: (row.verification_status as VerificationStatus) ?? "edited",
    isEdited: (row.is_edited as boolean) ?? true,
    originalAiContent: (row.original_ai_content as Record<string, unknown> | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPracticeRecommendation(row: Record<string, unknown>): PracticeRecommendation {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    gameReportId: row.game_report_id as string,
    title: row.title as string,
    priority: (row.priority as number) ?? 0,
    description: (row.description as string | null) ?? null,
    drillName: (row.drill_name as string | null) ?? null,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    coachingPoints: (row.coaching_points as string[]) ?? [],
    playerIds: (row.player_ids as string[]) ?? [],
    relatedInsightIds: (row.related_insight_ids as string[]) ?? [],
    confidence: (row.confidence as ConfidenceLevel) ?? "medium",
    verificationStatus: (row.verification_status as VerificationStatus) ?? "edited",
    isEdited: (row.is_edited as boolean) ?? true,
    originalAiContent: (row.original_ai_content as Record<string, unknown> | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToOpponentTendency(row: Record<string, unknown>): OpponentTendency {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    gameReportId: row.game_report_id as string,
    title: row.title as string,
    description: row.description as string,
    evidence: (row.evidence as EvidenceItem[]) ?? [],
    recommendedResponse: (row.recommended_response as string | null) ?? null,
    confidence: (row.confidence as ConfidenceLevel) ?? "medium",
    verificationStatus: (row.verification_status as VerificationStatus) ?? "edited",
    isEdited: (row.is_edited as boolean) ?? true,
    originalAiContent: (row.original_ai_content as Record<string, unknown> | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
