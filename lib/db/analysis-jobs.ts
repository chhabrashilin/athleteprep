/**
 * lib/db/analysis-jobs.ts — Analysis job data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AnalysisJob } from "@/types/database";
import type { AnalysisJobStatus } from "@/types/core";

// ---------------------------------------------------------------------------
// Internal transform
// ---------------------------------------------------------------------------

function rowToAnalysisJob(row: Record<string, unknown>): AnalysisJob {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: row.game_id as string,
    requestedBy: (row.requested_by as string | null) ?? null,
    status: (row.status as AnalysisJobStatus) ?? "pending",
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

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns the most recently created analysis job for a game.
 */
export async function getLatestAnalysisJobForGame(
  teamId: string,
  gameId: string
): Promise<AnalysisJob | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("analysis_jobs")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return rowToAnalysisJob(data as Record<string, unknown>);
}

/**
 * Returns all analysis jobs for a game, newest first.
 */
export async function getAnalysisJobsForGame(
  teamId: string,
  gameId: string
): Promise<AnalysisJob[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analysis_jobs")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToAnalysisJob(row as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Write functions
// ---------------------------------------------------------------------------

/**
 * Creates a new analysis job with status 'pending'.
 * Throws on failure.
 */
export async function createAnalysisJob(input: {
  teamId: string;
  gameId: string;
  provider?: string;
  modelName?: string;
  inputSnapshot?: Record<string, unknown>;
}): Promise<AnalysisJob> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to generate a report.");

  const { data, error } = await supabase
    .from("analysis_jobs")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      requested_by: user.id,
      status: "pending",
      provider: input.provider ?? "mock",
      model_name: input.modelName ?? null,
      input_snapshot: input.inputSnapshot ?? {},
      metadata: {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create analysis job.");
  }
  return rowToAnalysisJob(data as Record<string, unknown>);
}

/**
 * Marks an analysis job as running and sets started_at.
 */
export async function markAnalysisJobRunning(jobId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const { error } = await supabase
    .from("analysis_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) throw new Error(error.message ?? "Failed to mark job as running.");
}

/**
 * Marks an analysis job as completed, stores output snapshot.
 */
export async function markAnalysisJobCompleted(
  jobId: string,
  outputSnapshot: Record<string, unknown>
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const { error } = await supabase
    .from("analysis_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      output_snapshot: outputSnapshot,
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message ?? "Failed to mark job as completed.");
}

/**
 * Marks an analysis job as failed, stores error message.
 */
export async function markAnalysisJobFailed(
  jobId: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("analysis_jobs")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", jobId);
}

/**
 * Updates the input snapshot on an existing analysis job.
 */
export async function setAnalysisJobInputSnapshot(
  jobId: string,
  inputSnapshot: Record<string, unknown>
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("analysis_jobs")
    .update({ input_snapshot: inputSnapshot })
    .eq("id", jobId);
}
