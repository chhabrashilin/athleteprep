/**
 * lib/storage/videos.ts — Pure utility helpers for video storage paths and validation.
 * No Supabase calls here — only path construction, sanitization, and client-side
 * file validation. Safe to import in both server and client code.
 */
import {
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_VIDEO_UPLOAD_SIZE_BYTES,
} from "@/lib/constants/video";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Removes characters unsafe for storage paths; replaces spaces with hyphens.
 * Preserves the file extension.
 */
export function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const ext = lastDot >= 0 ? fileName.slice(lastDot).toLowerCase() : "";
  const base = lastDot >= 0 ? fileName.slice(0, lastDot) : fileName;

  const safeName = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return `${safeName || "video"}${ext}`;
}

/**
 * Builds a team-scoped, game-scoped storage path for a video file.
 * Format: teams/{teamId}/games/{gameId}/videos/{timestamp}-{sanitizedFileName}
 *
 * Using a timestamp prefix guarantees uniqueness and prevents accidental overwrites.
 */
export function buildGameVideoStoragePath(
  teamId: string,
  gameId: string,
  fileName: string
): string {
  const safe = sanitizeFileName(fileName);
  const ts = Date.now();
  return `teams/${teamId}/games/${gameId}/videos/${ts}-${safe}`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Client-side validation for a video file before upload.
 * Checks MIME type, extension, and file size.
 */
export function validateVideoFile(file: File): VideoValidationResult {
  const mimeOk = (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(
    file.type
  );

  const extOk = (ALLOWED_VIDEO_EXTENSIONS as readonly string[]).some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!mimeOk || !extOk) {
    return {
      valid: false,
      error: `Invalid file type. Allowed formats: MP4, MOV, WebM, AVI.`,
    };
  }

  if (file.size > MAX_VIDEO_UPLOAD_SIZE_BYTES) {
    const mb = (MAX_VIDEO_UPLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File too large. Maximum allowed size is ${mb} MB.`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Client-side metadata extraction
// ---------------------------------------------------------------------------

/**
 * Attempts to extract the video duration client-side using a temporary
 * HTMLVideoElement. Returns null if extraction fails (e.g. browser restriction).
 * Does not require any server processing.
 */
export function extractVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.src = "";
      };

      video.onloadedmetadata = () => {
        const duration = isFinite(video.duration) ? video.duration : null;
        cleanup();
        resolve(duration);
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.src = url;

      // Safety timeout — resolve null after 5 seconds if metadata never loads.
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);
    } catch {
      resolve(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Converts bytes to a human-readable string (e.g. "256 MB", "1.2 GB"). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Formats duration seconds as "m:ss" or "h:mm:ss". */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
