/**
 * lib/db/verification.ts — Verification feedback data access.
 * Used when coaches mark insights/reports as accurate, partially accurate,
 * inaccurate, or edited. All writes require staff-level team membership.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { VerificationFeedback, VerificationTargetType } from "@/types/database";
import type { VerificationStatus } from "@/types/core";
import type { SubmitVerificationFeedbackInput } from "@/types/verification";

const STAFF_ROLES = ["owner", "coach", "analyst"];

const TARGET_TABLE_MAP: Record<VerificationTargetType, string | null> = {
  coaching_insight: "coaching_insights",
  player_report: "player_reports",
  practice_recommendation: "practice_recommendations",
  opponent_tendency: "opponent_tendencies",
  game_report: null, // game_reports uses edited_output jsonb, not a status column
};

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Inserts a verification_feedback row and updates the target record's
 * verification_status. Requires staff role (owner / coach / analyst).
 *
 * Used for non-edit verification: accurate, partially_accurate, inaccurate.
 * Editing flows use insertFeedbackRow directly to avoid a double status update.
 */
export async function submitVerificationFeedback(
  input: SubmitVerificationFeedbackInput
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", input.teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !STAFF_ROLES.includes(membership.role as string)) {
    throw new Error("You do not have permission to verify report content.");
  }

  const { error: feedbackError } = await supabase.from("verification_feedback").insert({
    team_id: input.teamId,
    game_id: input.gameId ?? null,
    game_report_id: input.gameReportId ?? null,
    submitted_by: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    verification_status: input.verificationStatus,
    feedback_text: input.feedbackText ?? null,
    correction_text: input.correctionText ?? null,
    metadata: {},
  });

  if (feedbackError) {
    throw new Error(feedbackError.message ?? "Failed to save verification feedback.");
  }

  // Update target record verification_status (except game_report which has no such column)
  const tableName = TARGET_TABLE_MAP[input.targetType];
  if (tableName) {
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ verification_status: input.verificationStatus })
      .eq("id", input.targetId)
      .eq("team_id", input.teamId);

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to update verification status.");
    }
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getVerificationFeedbackForTarget(
  teamId: string,
  targetType: VerificationTargetType,
  targetId: string
): Promise<VerificationFeedback[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("verification_feedback")
    .select("*")
    .eq("team_id", teamId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data.map((row) => rowToVerificationFeedback(row as Record<string, unknown>));
}

export async function getVerificationFeedbackForReport(
  teamId: string,
  gameReportId: string
): Promise<VerificationFeedback[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("verification_feedback")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_report_id", gameReportId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((row) => rowToVerificationFeedback(row as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function rowToVerificationFeedback(row: Record<string, unknown>): VerificationFeedback {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: (row.game_id as string | null) ?? null,
    gameReportId: (row.game_report_id as string | null) ?? null,
    submittedBy: (row.submitted_by as string | null) ?? null,
    targetType: row.target_type as VerificationTargetType,
    targetId: row.target_id as string,
    verificationStatus: row.verification_status as VerificationStatus,
    feedbackText: (row.feedback_text as string | null) ?? null,
    correctionText: (row.correction_text as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}
