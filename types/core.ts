// Matches SQL: confidence_level enum
export type ConfidenceLevel = "high" | "medium" | "low";

// Matches SQL: verification_status enum
export type VerificationStatus =
  | "unreviewed"
  | "accurate"
  | "partially_accurate"
  | "inaccurate"
  | "edited";

// Matches SQL: analysis_job_status enum
export type AnalysisJobStatus = "pending" | "running" | "completed" | "failed";

// Matches SQL: team_role enum
export type TeamRole = "owner" | "coach" | "analyst" | "player" | "viewer";

// Matches SQL: share_visibility enum
export type ShareVisibility =
  | "staff_only"
  | "player_specific"
  | "public_summary"
  | "private_link";

// Matches SQL: export_status enum
export type ExportStatus = "pending" | "processing" | "completed" | "failed";

// Matches SQL: video_upload_status enum
export type VideoUploadStatus = "pending" | "uploading" | "uploaded" | "failed";

// Matches SQL: video_processing_status enum
export type VideoProcessingStatus =
  | "not_started"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ID = string;
export type TimestampString = string;
export type DateString = string;

export type SortDirection = "asc" | "desc";

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface ApiSuccess<T> {
  data: T;
}

// Deprecated alias — use TeamRole
export type UserRole = TeamRole;
// Deprecated alias — use AnalysisJobStatus
export type JobStatus = AnalysisJobStatus;
