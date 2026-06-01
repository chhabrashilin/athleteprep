/**
 * lib/db/video-assets.ts — Video asset data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SIGNED_URL_EXPIRY_SECONDS } from "@/lib/constants/video";
import type { VideoAsset } from "@/types/database";
import type { VideoUploadStatus, VideoProcessingStatus } from "@/types/core";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateVideoAssetInput {
  teamId: string;
  gameId: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal transform
// ---------------------------------------------------------------------------

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
    uploadStatus: (row.upload_status as VideoUploadStatus) ?? "uploaded",
    processingStatus:
      (row.processing_status as VideoProcessingStatus) ?? "not_started",
    processingError: (row.processing_error as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns all video assets for a game, ordered by most recently created.
 * RLS enforces team membership.
 */
export async function getVideoAssetsForGame(
  teamId: string,
  gameId: string
): Promise<VideoAsset[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("video_assets")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getVideoAssetsForGame error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToVideoAsset(row as Record<string, unknown>));
}

/**
 * Returns the most recently uploaded video asset for a game.
 * Returns null if none exist.
 */
export async function getPrimaryVideoAssetForGame(
  teamId: string,
  gameId: string
): Promise<VideoAsset | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("video_assets")
    .select("*")
    .eq("team_id", teamId)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return rowToVideoAsset(data as Record<string, unknown>);
}

/**
 * Returns a map of gameId → boolean (has at least one video asset) for multiple games.
 * Used for efficient video status display in the games list.
 */
export async function getVideoStatusForGames(
  teamId: string,
  gameIds: string[]
): Promise<Record<string, boolean>> {
  if (gameIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("video_assets")
    .select("game_id, upload_status")
    .eq("team_id", teamId)
    .in("game_id", gameIds)
    .neq("upload_status", "failed");

  if (error || !data) return {};

  const result: Record<string, boolean> = {};
  for (const row of data) {
    if (row.game_id) result[row.game_id as string] = true;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Write functions — RLS enforces is_team_staff for INSERT/UPDATE
// ---------------------------------------------------------------------------

/**
 * Creates a video_assets row after a successful storage upload.
 * The upload itself must be done client-side (to avoid routing large files through Next.js).
 * Throws on failure.
 */
export async function createVideoAssetRecord(
  input: CreateVideoAssetInput
): Promise<VideoAsset> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to add a video.");

  const { data, error } = await supabase
    .from("video_assets")
    .insert({
      team_id: input.teamId,
      game_id: input.gameId,
      uploaded_by: user.id,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      file_name: input.fileName,
      file_size_bytes: input.fileSizeBytes ?? null,
      mime_type: input.mimeType ?? null,
      duration_seconds: input.durationSeconds ?? null,
      upload_status: "uploaded",
      processing_status: "not_started",
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Failed to save video record. Please try again."
    );
  }

  return rowToVideoAsset(data as Record<string, unknown>);
}

/**
 * Marks a video asset upload as failed with an error message.
 */
export async function markVideoAssetUploadFailed(
  teamId: string,
  videoAssetId: string,
  errorMessage: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  await supabase
    .from("video_assets")
    .update({
      upload_status: "failed",
      processing_error: errorMessage,
    })
    .eq("id", videoAssetId)
    .eq("team_id", teamId);
}

/**
 * Deletes a video asset row from the database.
 * The caller is responsible for also deleting the storage object.
 * Throws on failure.
 */
export async function deleteVideoAssetRecord(
  teamId: string,
  gameId: string,
  videoAssetId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to delete a video.");

  const { error } = await supabase
    .from("video_assets")
    .delete()
    .eq("id", videoAssetId)
    .eq("team_id", teamId)
    .eq("game_id", gameId);

  if (error) {
    throw new Error(
      error.message ?? "Failed to delete video record. Please try again."
    );
  }
}

// ---------------------------------------------------------------------------
// Signed URL — generated server-side using authenticated session
// ---------------------------------------------------------------------------

/**
 * Creates a short-lived signed URL for private video playback.
 * Requires the storage bucket to have read policies for authenticated users.
 * Returns null on failure — caller should handle gracefully (show "unavailable" state).
 */
export async function createSignedVideoUrl(
  videoAsset: VideoAsset
): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(videoAsset.storageBucket)
    .createSignedUrl(videoAsset.storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("createSignedVideoUrl error:", error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Attempts to delete a storage object. Used for cleanup after DB insert failures.
 * Errors are logged but not thrown — this is a best-effort cleanup.
 */
export async function tryDeleteStorageObject(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("tryDeleteStorageObject error:", error.message, { bucket, path });
  }
}
