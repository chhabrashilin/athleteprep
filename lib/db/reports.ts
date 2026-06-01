/**
 * lib/db/reports.ts — Game report, coaching insight, player report,
 * practice recommendation, and opponent tendency data access.
 * All functions use the authenticated server Supabase client.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  GameReport,
  GameReportFull,
  CoachingInsight,
  PlayerReport,
  PracticeRecommendation,
  OpponentTendency,
  EvidenceItem,
  PlayerKeyMoment,
} from "@/types/database";
import type { ConfidenceLevel, VerificationStatus } from "@/types/core";
import type {
  GeneratedGameReport,
  GeneratedCoachingInsight,
  GeneratedPlayerReport,
  GeneratedPracticeRecommendation,
  GeneratedOpponentTendency,
  EvidenceReference,
} from "@/types/analysis";

// ---------------------------------------------------------------------------
// Internal transforms
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
    verificationStatus: (row.verification_status as VerificationStatus) ?? "unreviewed",
    evidence: (row.evidence as EvidenceItem[]) ?? [],
    assumptions: (row.assumptions as string[]) ?? [],
    affectedPlayerIds: (row.affected_player_ids as string[]) ?? [],
    relatedEventIds: (row.related_event_ids as string[]) ?? [],
    sortOrder: (row.sort_order as number) ?? 0,
    isEdited: (row.is_edited as boolean) ?? false,
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
    verificationStatus: (row.verification_status as VerificationStatus) ?? "unreviewed",
    isEdited: (row.is_edited as boolean) ?? false,
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
    verificationStatus: (row.verification_status as VerificationStatus) ?? "unreviewed",
    isEdited: (row.is_edited as boolean) ?? false,
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
    verificationStatus: (row.verification_status as VerificationStatus) ?? "unreviewed",
    isEdited: (row.is_edited as boolean) ?? false,
    originalAiContent: (row.original_ai_content as Record<string, unknown> | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns the current (latest) game report for a game, if one exists.
 */
export async function getCurrentGameReport(
  teamId: string,
  gameId: string
): Promise<GameReport | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("game_reports")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .eq("is_current", true)
    .order("report_version", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return rowToGameReport(data as Record<string, unknown>);
}

/**
 * Returns a specific report by ID.
 */
export async function getGameReportById(
  teamId: string,
  gameId: string,
  reportId: string
): Promise<GameReport | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("game_reports")
    .select("*")
    .eq("id", reportId)
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .single();

  if (error || !data) return null;
  return rowToGameReport(data as Record<string, unknown>);
}

/**
 * Returns the current game report with all related records.
 */
export async function getFullGameReport(
  teamId: string,
  gameId: string,
  reportId?: string
): Promise<GameReportFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  // Get the report
  let reportQuery = supabase
    .from("game_reports")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  if (reportId) {
    reportQuery = reportQuery.eq("id", reportId);
  } else {
    reportQuery = reportQuery.eq("is_current", true);
  }

  const { data: reportData, error: reportError } = await reportQuery
    .order("report_version", { ascending: false })
    .limit(1)
    .single();

  if (reportError || !reportData) return null;
  const report = rowToGameReport(reportData as Record<string, unknown>);

  // Fetch all related records in parallel
  const [insightsResult, playerReportsResult, practiceRecsResult, opponentResult] =
    await Promise.all([
      supabase
        .from("coaching_insights")
        .select("*")
        .eq("game_report_id", report.id)
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("player_reports")
        .select("*")
        .eq("game_report_id", report.id)
        .eq("team_id", teamId),
      supabase
        .from("practice_recommendations")
        .select("*")
        .eq("game_report_id", report.id)
        .eq("team_id", teamId)
        .order("priority", { ascending: true }),
      supabase
        .from("opponent_tendencies")
        .select("*")
        .eq("game_report_id", report.id)
        .eq("team_id", teamId),
    ]);

  return {
    ...report,
    insights: (insightsResult.data ?? []).map((r) => rowToCoachingInsight(r as Record<string, unknown>)),
    playerReports: (playerReportsResult.data ?? []).map((r) => rowToPlayerReport(r as Record<string, unknown>)),
    practiceRecommendations: (practiceRecsResult.data ?? []).map((r) => rowToPracticeRecommendation(r as Record<string, unknown>)),
    opponentTendencies: (opponentResult.data ?? []).map((r) => rowToOpponentTendency(r as Record<string, unknown>)),
  };
}

/**
 * Returns the next report version number for a game.
 * Returns 1 if no reports exist yet.
 */
export async function getReportVersionNumber(
  teamId: string,
  gameId: string
): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 1;

  const { data, error } = await supabase
    .from("game_reports")
    .select("report_version")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("report_version", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return 1;
  return ((data.report_version as number) ?? 0) + 1;
}

// ---------------------------------------------------------------------------
// Write functions
// ---------------------------------------------------------------------------

/**
 * Marks all existing reports for a game as not current.
 * Call before inserting a new report version.
 */
export async function setPreviousReportsNotCurrent(
  teamId: string,
  gameId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const { error } = await supabase
    .from("game_reports")
    .update({ is_current: false })
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .eq("is_current", true);

  if (error) {
    throw new Error(error.message ?? "Failed to update previous reports.");
  }
}

export interface CreateGameReportWithDetailsInput {
  teamId: string;
  gameId: string;
  analysisJobId: string;
  version: number;
  generated: GeneratedGameReport;
  rawAiOutput: Record<string, unknown>;
}

/**
 * Inserts a game_report row and all related child records.
 * Returns the created report.
 * Note: Supabase JS does not support multi-statement transactions natively.
 * Each insert is sequential. If a child insert fails, the parent report exists.
 * This is an acceptable MVP tradeoff documented in /docs/ANALYSIS_JOBS.md.
 */
export async function createGameReportWithDetails(
  input: CreateGameReportWithDetailsInput
): Promise<GameReport> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to save a report.");

  const g = input.generated;

  // 1. Insert game_report
  const { data: reportData, error: reportError } = await supabase
    .from("game_reports")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      analysis_job_id: input.analysisJobId,
      created_by: user.id,
      title: g.title,
      executive_summary: g.executiveSummary,
      overall_confidence: g.overallConfidence,
      report_version: input.version,
      is_current: true,
      ai_generated: true,
      raw_ai_output: input.rawAiOutput,
      edited_output: null,
      assumptions: g.assumptions,
      limitations: g.limitations,
    })
    .select()
    .single();

  if (reportError || !reportData) {
    throw new Error(reportError?.message ?? "Failed to create game report.");
  }

  const report = rowToGameReport(reportData as Record<string, unknown>);
  const reportId = report.id;

  // 2. Insert coaching insights
  if (g.coachingInsights.length > 0) {
    const insightRows = g.coachingInsights.map((ci: GeneratedCoachingInsight) => ({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: reportId,
      title: ci.title,
      summary: ci.summary,
      why_it_matters: ci.whyItMatters,
      recommended_action: ci.recommendedAction,
      confidence: ci.confidence,
      verification_status: "unreviewed",
      evidence: ci.evidence as unknown as Record<string, unknown>[],
      assumptions: ci.assumptions,
      affected_player_ids: ci.affectedPlayerIds,
      related_event_ids: ci.relatedEventIds,
      sort_order: ci.sortOrder,
      is_edited: false,
      original_ai_content: null,
      metadata: {},
    }));

    const { error: insightError } = await supabase
      .from("coaching_insights")
      .insert(insightRows);

    if (insightError) {
      console.error("Failed to insert coaching insights:", insightError.message);
    }
  }

  // 3. Insert player reports
  if (g.playerReports.length > 0) {
    const playerRows = g.playerReports.map((pr: GeneratedPlayerReport) => ({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: reportId,
      player_id: pr.playerId,
      player_display_name: pr.playerDisplayName,
      summary: pr.summary,
      strengths: pr.strengths,
      improvement_areas: pr.improvementAreas,
      key_moments: pr.keyMoments as unknown as Record<string, unknown>[],
      recommended_focus: pr.recommendedFocus,
      player_facing_summary: pr.playerFacingSummary,
      confidence: pr.confidence,
      verification_status: "unreviewed",
      is_edited: false,
      original_ai_content: null,
      metadata: { dataCoverage: pr.dataCoverage },
    }));

    const { error: playerError } = await supabase
      .from("player_reports")
      .insert(playerRows);

    if (playerError) {
      console.error("Failed to insert player reports:", playerError.message);
    }
  }

  // 4. Insert practice recommendations
  if (g.practiceRecommendations.length > 0) {
    const pracRows = g.practiceRecommendations.map((rec: GeneratedPracticeRecommendation) => ({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: reportId,
      title: rec.title,
      priority: rec.priority,
      description: rec.description,
      drill_name: rec.drillName,
      duration_minutes: rec.durationMinutes,
      coaching_points: rec.coachingPoints,
      player_ids: rec.playerIds,
      related_insight_ids: [],
      confidence: rec.confidence,
      metadata: {},
    }));

    const { error: pracError } = await supabase
      .from("practice_recommendations")
      .insert(pracRows);

    if (pracError) {
      console.error("Failed to insert practice recommendations:", pracError.message);
    }
  }

  // 5. Insert opponent tendencies
  if (g.opponentTendencies.length > 0) {
    const oppRows = g.opponentTendencies.map((ot: GeneratedOpponentTendency) => ({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: reportId,
      title: ot.title,
      description: ot.description,
      evidence: ot.evidence as unknown as Record<string, unknown>[],
      recommended_response: ot.recommendedResponse,
      confidence: ot.confidence,
      tags: ot.tags,
      metadata: {},
    }));

    const { error: oppError } = await supabase
      .from("opponent_tendencies")
      .insert(oppRows);

    if (oppError) {
      console.error("Failed to insert opponent tendencies:", oppError.message);
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// New functions for Prompt 10 — Full Report Dashboard
// ---------------------------------------------------------------------------

import type { Game, VideoAsset, EventTimestamp, Player } from "@/types/database";
import type { AnalysisJob } from "@/types/database";

export interface FullGameReportData {
  team: { id: string; name: string; sport: string };
  game: Game;
  report: GameReport;
  videoAsset: VideoAsset | null;
  signedVideoUrl: string | null;
  insights: CoachingInsight[];
  playerReports: PlayerReport[];
  practiceRecommendations: PracticeRecommendation[];
  opponentTendencies: OpponentTendency[];
  evidenceEvents: EventTimestamp[];
  players: Player[];
  latestJob: AnalysisJob | null;
  reportVersions: GameReport[];
}

function rowToEventTimestamp(row: Record<string, unknown>): EventTimestamp {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    videoAssetId: (row.video_asset_id as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    timestampSeconds: Number(row.timestamp_seconds),
    endTimestampSeconds: row.end_timestamp_seconds != null ? Number(row.end_timestamp_seconds) : null,
    label: row.label as string,
    eventType: (row.event_type as string | null) ?? null,
    teamContext: (row.team_context as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    importance: (row.importance as "low" | "medium" | "high" | "critical") ?? "medium",
    tags: (row.tags as string[]) ?? [],
    playerIds: (row.player_ids as string[]) ?? [],
    opponentPlayerNames: (row.opponent_player_names as string[]) ?? [],
    isAiGenerated: (row.is_ai_generated as boolean) ?? false,
    confidence: null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    userId: (row.user_id as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: (row.last_name as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    jerseyNumber: (row.jersey_number as string | null) ?? null,
    position: (row.position as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    dominantSide: (row.dominant_side as string | null) ?? null,
    classYear: (row.class_year as string | null) ?? null,
    height: (row.height as string | null) ?? null,
    weight: (row.weight as string | null) ?? null,
    status: (row.status as string) ?? "active",
    notes: (row.notes as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToVideoAsset(row: Record<string, unknown>): VideoAsset {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: (row.game_id as string | null) ?? null,
    uploadedBy: (row.uploaded_by as string | null) ?? null,
    storageBucket: row.storage_bucket as string,
    storagePath: row.storage_path as string,
    publicUrl: (row.public_url as string | null) ?? null,
    fileName: row.file_name as string,
    fileSizeBytes: (row.file_size_bytes as number | null) ?? null,
    mimeType: (row.mime_type as string | null) ?? null,
    durationSeconds: (row.duration_seconds as number | null) ?? null,
    thumbnailPath: (row.thumbnail_path as string | null) ?? null,
    uploadStatus: (row.upload_status as "pending" | "uploading" | "uploaded" | "failed") ?? "uploaded",
    processingStatus: (row.processing_status as "not_started" | "pending" | "processing" | "completed" | "failed") ?? "not_started",
    processingError: (row.processing_error as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToAnalysisJob(row: Record<string, unknown>): AnalysisJob {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    requestedBy: (row.requested_by as string | null) ?? null,
    status: (row.status as "pending" | "running" | "completed" | "failed") ?? "completed",
    provider: (row.provider as string) ?? "mock",
    modelName: (row.model_name as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    failedAt: (row.failed_at as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    inputSnapshot: (row.input_snapshot as Record<string, unknown>) ?? {},
    outputSnapshot: (row.output_snapshot as Record<string, unknown> | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Fetches a single coaching insight by ID, scoped to team and game.
 */
export async function getCoachingInsightById(
  teamId: string,
  gameId: string,
  insightId: string
): Promise<CoachingInsight | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("coaching_insights")
    .select("*")
    .eq("id", insightId)
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .single();

  if (error || !data) return null;
  return rowToCoachingInsight(data as Record<string, unknown>);
}

/**
 * Returns all report versions for a game, newest first.
 */
export async function getReportVersionsForGame(
  teamId: string,
  gameId: string
): Promise<GameReport[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("game_reports")
    .select("id, team_id, game_id, analysis_job_id, created_by, title, executive_summary, overall_confidence, report_version, is_current, ai_generated, raw_ai_output, edited_output, assumptions, limitations, created_at, updated_at")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("report_version", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToGameReport(row as Record<string, unknown>));
}

/**
 * Returns the fully enriched report data for the dashboard.
 * Includes report + all sections + resolved events + players + video.
 */
export async function getFullGameReportData(
  teamId: string,
  gameId: string,
  reportId?: string
): Promise<FullGameReportData | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  // 1. Load the report first
  let reportQuery = supabase
    .from("game_reports")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId);
  if (reportId) {
    reportQuery = reportQuery.eq("id", reportId);
  } else {
    reportQuery = reportQuery.eq("is_current", true);
  }
  const { data: reportRow, error: reportErr } = await reportQuery
    .order("report_version", { ascending: false })
    .limit(1)
    .single();

  if (reportErr || !reportRow) return null;
  const report = rowToGameReport(reportRow as Record<string, unknown>);

  // 2. Fetch everything in parallel
  const [
    teamResult,
    gameResult,
    insightsResult,
    playerReportsResult,
    pracRecsResult,
    opponentResult,
    videoResult,
    rosterResult,
    versionsResult,
    latestJobResult,
  ] = await Promise.all([
    supabase.from("teams").select("id, name, sport").eq("id", teamId).single(),
    supabase.from("games").select("*").eq("id", gameId).eq("team_id", teamId).single(),
    supabase
      .from("coaching_insights")
      .select("*")
      .eq("game_report_id", report.id)
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("player_reports")
      .select("*")
      .eq("game_report_id", report.id)
      .eq("team_id", teamId),
    supabase
      .from("practice_recommendations")
      .select("*")
      .eq("game_report_id", report.id)
      .eq("team_id", teamId)
      .order("priority", { ascending: true }),
    supabase
      .from("opponent_tendencies")
      .select("*")
      .eq("game_report_id", report.id)
      .eq("team_id", teamId),
    supabase
      .from("video_assets")
      .select("*")
      .eq("team_id", teamId)
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .neq("status", "archived"),
    supabase
      .from("game_reports")
      .select("id, report_version, is_current, overall_confidence, created_at, updated_at, title, team_id, game_id, analysis_job_id, created_by, executive_summary, ai_generated, raw_ai_output, edited_output, assumptions, limitations")
      .eq("team_id", teamId)
      .eq("game_id", gameId)
      .order("report_version", { ascending: false }),
    supabase
      .from("analysis_jobs")
      .select("*")
      .eq("team_id", teamId)
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const insights = (insightsResult.data ?? []).map((r) => rowToCoachingInsight(r as Record<string, unknown>));
  const playerReports = (playerReportsResult.data ?? []).map((r) => rowToPlayerReport(r as Record<string, unknown>));
  const practiceRecommendations = (pracRecsResult.data ?? []).map((r) => rowToPracticeRecommendation(r as Record<string, unknown>));
  const opponentTendencies = (opponentResult.data ?? []).map((r) => rowToOpponentTendency(r as Record<string, unknown>));
  const players = (rosterResult.data ?? []).map((r) => rowToPlayer(r as Record<string, unknown>));
  const reportVersions = (versionsResult.data ?? []).map((r) => rowToGameReport(r as Record<string, unknown>));
  const latestJobRow = latestJobResult.data?.[0];
  const latestJob = latestJobRow ? rowToAnalysisJob(latestJobRow as Record<string, unknown>) : null;

  // 3. Collect all evidence event IDs
  const evidenceEventIds = new Set<string>();
  for (const insight of insights) {
    for (const ev of insight.evidence) {
      if (ev.eventId) evidenceEventIds.add(ev.eventId);
    }
  }
  for (const tendency of opponentTendencies) {
    for (const ev of tendency.evidence) {
      if ((ev as EvidenceItem & { eventId?: string }).eventId) {
        evidenceEventIds.add((ev as EvidenceItem & { eventId?: string }).eventId!);
      }
    }
  }

  // 4. Fetch referenced events
  let evidenceEvents: EventTimestamp[] = [];
  if (evidenceEventIds.size > 0) {
    const { data: evRows } = await supabase
      .from("event_timestamps")
      .select("*")
      .eq("team_id", teamId)
      .in("id", Array.from(evidenceEventIds));
    evidenceEvents = (evRows ?? []).map((r) => rowToEventTimestamp(r as Record<string, unknown>));
  }

  // 5. Generate signed URL for video
  let signedVideoUrl: string | null = null;
  let videoAsset: VideoAsset | null = null;
  const videoRow = videoResult.data?.[0];
  if (videoRow) {
    videoAsset = rowToVideoAsset(videoRow as Record<string, unknown>);
    const { data: urlData } = await supabase.storage
      .from(videoAsset.storageBucket)
      .createSignedUrl(videoAsset.storagePath, 3600);
    signedVideoUrl = urlData?.signedUrl ?? null;
  }

  // 6. Build team + game
  const teamRow = teamResult.data;
  const gameRow = gameResult.data;
  if (!teamRow || !gameRow) return null;

  // Build a minimal Game shape from gameRow
  const game: Game = {
    id: gameRow.id as string,
    teamId: gameRow.team_id as string,
    createdBy: (gameRow.created_by as string | null) ?? null,
    sport: gameRow.sport as "soccer" | "cricket" | "basketball" | "american_football" | "hockey" | "volleyball" | "other",
    gameType: gameRow.game_type as "match" | "practice" | "scrimmage" | "film_session",
    title: gameRow.title as string,
    opponentName: (gameRow.opponent_name as string | null) ?? null,
    gameDate: (gameRow.game_date as string | null) ?? null,
    startTime: (gameRow.start_time as string | null) ?? null,
    homeAway: (gameRow.home_away as "home" | "away" | "neutral" | "not_applicable") ?? "not_applicable",
    venue: (gameRow.venue as string | null) ?? null,
    competitionName: (gameRow.competition_name as string | null) ?? null,
    teamScore: (gameRow.team_score as string | null) ?? null,
    opponentScore: (gameRow.opponent_score as string | null) ?? null,
    result: (gameRow.result as string | null) ?? null,
    summaryNotes: (gameRow.summary_notes as string | null) ?? null,
    coachNotes: (gameRow.coach_notes as string | null) ?? null,
    opponentNotes: (gameRow.opponent_notes as string | null) ?? null,
    status: (gameRow.status as "draft" | "ready_for_analysis" | "analysis_running" | "analyzed" | "archived") ?? "draft",
    metadata: (gameRow.metadata as Record<string, unknown>) ?? {},
    createdAt: gameRow.created_at as string,
    updatedAt: gameRow.updated_at as string,
  };

  return {
    team: {
      id: teamRow.id as string,
      name: teamRow.name as string,
      sport: teamRow.sport as string,
    },
    game,
    report,
    videoAsset,
    signedVideoUrl,
    insights,
    playerReports,
    practiceRecommendations,
    opponentTendencies,
    evidenceEvents,
    players,
    latestJob,
    reportVersions,
  };
}

export interface RecentReportSummary {
  reportId: string;
  gameId: string;
  teamId: string;
  title: string;
  overallConfidence: ConfidenceLevel;
  reportVersion: number;
  createdAt: string;
}

/**
 * Returns the most recent current reports across a set of teams.
 * Used to populate the dashboard recent-reports panel.
 */
export async function getRecentReportsForTeams(
  teamIds: string[],
  limit = 5
): Promise<RecentReportSummary[]> {
  if (teamIds.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("game_reports")
    .select("id, game_id, team_id, title, overall_confidence, report_version, created_at")
    .in("team_id", teamIds)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    reportId: row.id as string,
    gameId: row.game_id as string,
    teamId: row.team_id as string,
    title: row.title as string,
    overallConfidence: (row.overall_confidence as ConfidenceLevel) ?? "medium",
    reportVersion: (row.report_version as number) ?? 1,
    createdAt: row.created_at as string,
  }));
}

/**
 * Returns the count of current (non-archived) game reports for a team.
 * Used to populate the Reports card on the team workspace page.
 */
export async function getTeamReportCount(teamId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("game_reports")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("is_current", true);

  if (error) return 0;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Kept for backward compatibility with old stubs imported elsewhere
// ---------------------------------------------------------------------------

export type { EvidenceReference };
