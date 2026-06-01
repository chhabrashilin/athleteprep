import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ExportRecord, CreateExportInput, ExportType } from "@/types/export";
import type { ExportStatus } from "@/types/core";

const STAFF_ROLES = ["owner", "coach", "analyst"];

// ---------------------------------------------------------------------------
// Row transform
// ---------------------------------------------------------------------------

function rowToExportRecord(row: Record<string, unknown>): ExportRecord {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    gameId: (row.game_id as string | null) ?? null,
    gameReportId: (row.game_report_id as string | null) ?? null,
    requestedBy: (row.requested_by as string | null) ?? null,
    exportType: (row.export_type as ExportType | string) ?? "browser_pdf",
    status: (row.status as ExportStatus) ?? "pending",
    storageBucket: (row.storage_bucket as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getExportsForReport(
  teamId: string,
  gameReportId: string
): Promise<ExportRecord[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("exports")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_report_id", gameReportId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToExportRecord(row as Record<string, unknown>));
}

export async function getExportById(
  teamId: string,
  exportId: string
): Promise<ExportRecord | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("exports")
    .select("*")
    .eq("id", exportId)
    .eq("team_id", teamId)
    .single();

  if (error || !data) return null;
  return rowToExportRecord(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export async function createExportRecord(
  input: CreateExportInput
): Promise<ExportRecord> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new Error("Database is not configured.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to create an export.");

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", input.teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !STAFF_ROLES.includes(membership.role as string)) {
    throw new Error("You do not have permission to export reports.");
  }

  const { data, error } = await supabase
    .from("exports")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      game_report_id: input.gameReportId,
      requested_by: user.id,
      export_type: input.exportType,
      status: "processing" as ExportStatus,
      storage_bucket: null,
      storage_path: null,
      error_message: null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create export record.");
  }

  return rowToExportRecord(data as Record<string, unknown>);
}

export async function markExportCompleted(
  exportId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const updatePayload: Record<string, unknown> = { status: "completed" };
  if (metadata) updatePayload.metadata = metadata;

  await supabase
    .from("exports")
    .update(updatePayload)
    .eq("id", exportId);
}

export async function markExportFailed(
  exportId: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("exports")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", exportId);
}
