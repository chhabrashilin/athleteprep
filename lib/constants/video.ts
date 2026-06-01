/** Allowed MIME types for video uploads. */
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
] as const;

/** Allowed file extensions (lowercase). */
export const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi"] as const;

/**
 * Max video upload size: 1 GB.
 * Supabase Storage free tier supports up to 50 MB per request via browser upload;
 * larger files require chunked/multipart upload or the Supabase dashboard upload.
 * For v1, we accept up to 1 GB in the DB but warn the user that very large files
 * may fail depending on their Supabase plan and bucket configuration.
 *
 * To practically enforce a lower limit client-side during development, set
 * MAX_VIDEO_UPLOAD_SIZE_BYTES to 250 MB or another value and update the help text.
 */
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB

/** Human-readable max size label shown in the upload UI. */
export const MAX_VIDEO_UPLOAD_SIZE_LABEL = "1 GB";

/** Supabase Storage bucket name for game videos. */
export const GAME_VIDEO_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "game-videos";

/** Signed URL expiry in seconds (1 hour for playback). */
export const SIGNED_URL_EXPIRY_SECONDS = 3600;
