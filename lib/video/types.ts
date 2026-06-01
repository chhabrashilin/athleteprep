/**
 * lib/video/types.ts — Video-related types for the application layer.
 * These align with the Postgres enum values in lib/supabase/types.ts.
 */

/** Matches the DB video_upload_status enum. */
export type VideoUploadStatus = "pending" | "uploading" | "uploaded" | "failed";

/** Matches the DB video_processing_status enum. */
export type VideoProcessingStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** Metadata stored in the video_assets.metadata JSONB column (optional extensions). */
export interface VideoAssetMetadata {
  widthPx?: number;
  heightPx?: number;
  frameRate?: number;
  bitrate?: number;
  codecName?: string;
  thumbnailUrl?: string;
}

/** A timestamped event associated with a video (used by the future timestamp editor). */
export interface TimestampedEvent {
  id: string;
  timeSeconds: number;
  endTimeSeconds?: number;
  label: string;
  description?: string;
  tags: string[];
  thumbnailUrl?: string;
}

/** Upload progress tracking (used by the VideoUploadCard UI). */
export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
