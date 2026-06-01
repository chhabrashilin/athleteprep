"use server";

import {
  createVideoAssetRecord,
  deleteVideoAssetRecord,
  tryDeleteStorageObject,
  type CreateVideoAssetInput,
} from "@/lib/db/video-assets";
import type { VideoAsset } from "@/types/database";

/**
 * Server action: create a video_assets database record after a successful
 * client-side storage upload.
 *
 * The client is responsible for uploading to Supabase Storage directly (to avoid
 * routing large video files through the Next.js server). This action is called
 * after the storage upload completes to persist the metadata.
 *
 * If the DB insert fails after a successful storage upload, this action attempts
 * to clean up the orphaned storage object.
 */
export async function saveVideoAssetAction(
  input: CreateVideoAssetInput
): Promise<{ data: VideoAsset } | { error: string }> {
  try {
    const asset = await createVideoAssetRecord(input);
    return { data: asset };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save video record.";

    // Best-effort cleanup of the orphaned storage object.
    try {
      await tryDeleteStorageObject(input.storageBucket, input.storagePath);
    } catch {
      // Cleanup failure is logged inside tryDeleteStorageObject — swallow here.
    }

    return { error: message };
  }
}

/**
 * Server action: delete a video asset record and its corresponding storage object.
 * Requires the caller to be a team staff member (enforced by RLS on video_assets DELETE).
 */
export async function deleteVideoAssetAction(
  teamId: string,
  gameId: string,
  videoAssetId: string,
  storageBucket: string,
  storagePath: string
): Promise<{ error?: string }> {
  try {
    // Delete DB record first (if RLS blocks, we want to fail before touching storage).
    await deleteVideoAssetRecord(teamId, gameId, videoAssetId);

    // Remove the storage object after DB record is gone.
    await tryDeleteStorageObject(storageBucket, storagePath);

    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete video.";
    return { error: message };
  }
}
