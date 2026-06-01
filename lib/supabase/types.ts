// =============================================================================
// GameIQ — Supabase Database Types
//
// This file contains a manually-authored placeholder that mirrors the schema
// defined in supabase/migrations/0001_initial_schema.sql.
//
// In production, replace this with the output of:
//   npx supabase gen types typescript --project-id <your-project-id>
//
// See /docs/SUPABASE_SETUP.md for instructions.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// SQL enum mirrors — these string unions exactly match the Postgres enums.
export type DbTeamRole = "owner" | "coach" | "analyst" | "player" | "viewer";
export type DbSportType = "soccer" | "cricket" | "basketball" | "american_football" | "hockey" | "volleyball" | "other";
export type DbGameType = "match" | "practice" | "scrimmage" | "film_session";
export type DbHomeAwayStatus = "home" | "away" | "neutral" | "not_applicable";
export type DbEventImportance = "low" | "medium" | "high" | "critical";
export type DbAnalysisJobStatus = "pending" | "running" | "completed" | "failed";
export type DbConfidenceLevel = "high" | "medium" | "low";
export type DbVerificationStatus = "unreviewed" | "accurate" | "partially_accurate" | "inaccurate" | "edited";
export type DbShareVisibility = "staff_only" | "player_specific" | "public_summary" | "private_link";
export type DbExportStatus = "pending" | "processing" | "completed" | "failed";
export type DbVideoUploadStatus = "pending" | "uploading" | "uploaded" | "failed";
export type DbVideoProcessingStatus = "not_started" | "pending" | "processing" | "completed" | "failed";

// Row types for each table — snake_case to match Postgres columns.
export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  default_team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  slug: string | null;
  sport: DbSportType;
  organization_name: string | null;
  level: string | null;
  location: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string | null;
  role: DbTeamRole;
  invited_email: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerRow {
  id: string;
  team_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  jersey_number: string | null;
  position: string | null;
  role: string | null;
  dominant_side: string | null;
  class_year: string | null;
  height: string | null;
  weight: string | null;
  status: string;
  notes: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface GameRow {
  id: string;
  team_id: string;
  created_by: string | null;
  sport: DbSportType;
  game_type: DbGameType;
  title: string;
  opponent_name: string | null;
  game_date: string | null;
  start_time: string | null;
  home_away: DbHomeAwayStatus;
  venue: string | null;
  competition_name: string | null;
  team_score: string | null;
  opponent_score: string | null;
  result: string | null;
  summary_notes: string | null;
  coach_notes: string | null;
  opponent_notes: string | null;
  status: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface VideoAssetRow {
  id: string;
  team_id: string;
  game_id: string | null;
  uploaded_by: string | null;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  file_name: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  thumbnail_path: string | null;
  upload_status: DbVideoUploadStatus;
  processing_status: DbVideoProcessingStatus;
  processing_error: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface EventTimestampRow {
  id: string;
  team_id: string;
  game_id: string;
  video_asset_id: string | null;
  created_by: string | null;
  timestamp_seconds: number;
  end_timestamp_seconds: number | null;
  label: string;
  event_type: string | null;
  team_context: string | null;
  description: string | null;
  importance: DbEventImportance;
  tags: string[];
  player_ids: string[];
  opponent_player_names: string[];
  is_ai_generated: boolean;
  confidence: DbConfidenceLevel | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface AnalysisJobRow {
  id: string;
  team_id: string;
  game_id: string;
  requested_by: string | null;
  status: DbAnalysisJobStatus;
  provider: string;
  model_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  input_snapshot: Json;
  output_snapshot: Json | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface GameReportRow {
  id: string;
  team_id: string;
  game_id: string;
  analysis_job_id: string | null;
  created_by: string | null;
  title: string;
  executive_summary: string | null;
  overall_confidence: DbConfidenceLevel;
  report_version: number;
  is_current: boolean;
  ai_generated: boolean;
  raw_ai_output: Json;
  edited_output: Json | null;
  assumptions: string[];
  limitations: string[];
  created_at: string;
  updated_at: string;
}

export interface CoachingInsightRow {
  id: string;
  team_id: string;
  game_id: string;
  game_report_id: string;
  title: string;
  summary: string;
  why_it_matters: string | null;
  recommended_action: string | null;
  confidence: DbConfidenceLevel;
  verification_status: DbVerificationStatus;
  evidence: Json;
  assumptions: string[];
  affected_player_ids: string[];
  related_event_ids: string[];
  sort_order: number;
  is_edited: boolean;
  original_ai_content: Json | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface PlayerReportRow {
  id: string;
  team_id: string;
  game_id: string;
  game_report_id: string;
  player_id: string | null;
  player_display_name: string | null;
  summary: string | null;
  strengths: string[];
  improvement_areas: string[];
  key_moments: Json;
  recommended_focus: string | null;
  player_facing_summary: string | null;
  confidence: DbConfidenceLevel;
  verification_status: DbVerificationStatus;
  is_edited: boolean;
  original_ai_content: Json | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

// Supabase GenericTable requires Relationships to be present.
type NoRelationships = { Relationships: [] };

// Minimal Database interface used by the Supabase client generic.
// Replace with the output of `supabase gen types typescript` when Supabase is configured.
// See /docs/SUPABASE_SETUP.md for generation instructions.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow> & Pick<ProfileRow, "id">; Update: Partial<ProfileRow> } & NoRelationships;
      teams: { Row: TeamRow; Insert: Omit<TeamRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<TeamRow> } & NoRelationships;
      team_members: { Row: TeamMemberRow; Insert: Omit<TeamMemberRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<TeamMemberRow> } & NoRelationships;
      players: { Row: PlayerRow; Insert: Omit<PlayerRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<PlayerRow> } & NoRelationships;
      games: { Row: GameRow; Insert: Omit<GameRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<GameRow> } & NoRelationships;
      video_assets: { Row: VideoAssetRow; Insert: Omit<VideoAssetRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<VideoAssetRow> } & NoRelationships;
      event_timestamps: { Row: EventTimestampRow; Insert: Omit<EventTimestampRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<EventTimestampRow> } & NoRelationships;
      analysis_jobs: { Row: AnalysisJobRow; Insert: Omit<AnalysisJobRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<AnalysisJobRow> } & NoRelationships;
      game_reports: { Row: GameReportRow; Insert: Omit<GameReportRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<GameReportRow> } & NoRelationships;
      coaching_insights: { Row: CoachingInsightRow; Insert: Omit<CoachingInsightRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<CoachingInsightRow> } & NoRelationships;
      player_reports: { Row: PlayerReportRow; Insert: Omit<PlayerReportRow, "id" | "created_at" | "updated_at"> & { id?: string }; Update: Partial<PlayerReportRow> } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: {
      is_team_member: { Args: { p_team_id: string }; Returns: boolean };
      has_team_role: { Args: { p_team_id: string; p_roles: DbTeamRole[] }; Returns: boolean };
      is_team_staff: { Args: { p_team_id: string }; Returns: boolean };
      is_team_manager: { Args: { p_team_id: string }; Returns: boolean };
    };
    CompositeTypes: Record<string, never>;
    Enums: {
      team_role: DbTeamRole;
      sport_type: DbSportType;
      game_type: DbGameType;
      home_away_status: DbHomeAwayStatus;
      event_importance: DbEventImportance;
      analysis_job_status: DbAnalysisJobStatus;
      confidence_level: DbConfidenceLevel;
      verification_status: DbVerificationStatus;
      share_visibility: DbShareVisibility;
      export_status: DbExportStatus;
      video_upload_status: DbVideoUploadStatus;
      video_processing_status: DbVideoProcessingStatus;
    };
  };
}
