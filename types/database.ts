import type {
  ID,
  TimestampString,
  DateString,
  TeamRole,
  ConfidenceLevel,
  VerificationStatus,
  AnalysisJobStatus,
  ShareVisibility,
  VideoUploadStatus,
  VideoProcessingStatus,
} from "./core";
import type {
  SportType,
  GameType,
  HomeAwayStatus,
  EventImportance,
} from "./sports";

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------
export interface Profile {
  id: ID;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  defaultTeamId: ID | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// teams
// ---------------------------------------------------------------------------
export interface Team {
  id: ID;
  name: string;
  slug: string | null;
  sport: SportType;
  organizationName: string | null;
  level: string | null;
  location: string | null;
  description: string | null;
  createdBy: ID | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// team_members
// ---------------------------------------------------------------------------
export interface TeamMember {
  id: ID;
  teamId: ID;
  userId: ID | null;
  role: TeamRole;
  invitedEmail: string | null;
  joinedAt: TimestampString | null;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface TeamMemberWithProfile extends TeamMember {
  profile: Profile | null;
}

// ---------------------------------------------------------------------------
// players
// ---------------------------------------------------------------------------
export type PlayerStatus =
  | "active"
  | "inactive"
  | "injured"
  | "graduated"
  | "archived";

export interface Player {
  id: ID;
  teamId: ID;
  userId: ID | null;
  firstName: string;
  lastName: string | null;
  displayName: string | null;
  jerseyNumber: string | null;
  position: string | null;
  role: string | null;
  dominantSide: string | null;
  classYear: string | null;
  height: string | null;
  weight: string | null;
  status: PlayerStatus | string;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// games
// ---------------------------------------------------------------------------
export type GameStatus =
  | "draft"
  | "ready_for_analysis"
  | "analysis_running"
  | "analyzed"
  | "archived";

export interface Game {
  id: ID;
  teamId: ID;
  createdBy: ID | null;
  sport: SportType;
  gameType: GameType;
  title: string;
  opponentName: string | null;
  gameDate: DateString | null;
  startTime: TimestampString | null;
  homeAway: HomeAwayStatus;
  venue: string | null;
  competitionName: string | null;
  teamScore: string | null;
  opponentScore: string | null;
  result: string | null;
  summaryNotes: string | null;
  coachNotes: string | null;
  opponentNotes: string | null;
  status: GameStatus;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// video_assets
// ---------------------------------------------------------------------------
export interface VideoAsset {
  id: ID;
  teamId: ID;
  gameId: ID | null;
  uploadedBy: ID | null;
  storageBucket: string;
  storagePath: string;
  publicUrl: string | null;
  fileName: string;
  fileSizeBytes: number | null;
  mimeType: string | null;
  durationSeconds: number | null;
  thumbnailPath: string | null;
  uploadStatus: VideoUploadStatus;
  processingStatus: VideoProcessingStatus;
  processingError: string | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// event_timestamps
// ---------------------------------------------------------------------------
export interface EventTimestamp {
  id: ID;
  teamId: ID;
  gameId: ID;
  videoAssetId: ID | null;
  createdBy: ID | null;
  timestampSeconds: number;
  endTimestampSeconds: number | null;
  label: string;
  eventType: string | null;
  teamContext: string | null;
  description: string | null;
  importance: EventImportance;
  tags: string[];
  playerIds: ID[];
  opponentPlayerNames: string[];
  isAiGenerated: boolean;
  confidence: ConfidenceLevel | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// clips
// ---------------------------------------------------------------------------
export interface Clip {
  id: ID;
  teamId: ID;
  gameId: ID;
  videoAssetId: ID | null;
  eventTimestampId: ID | null;
  title: string;
  description: string | null;
  startSeconds: number;
  endSeconds: number | null;
  storagePath: string | null;
  thumbnailPath: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// analysis_jobs
// ---------------------------------------------------------------------------
export interface AnalysisJob {
  id: ID;
  teamId: ID;
  gameId: ID;
  requestedBy: ID | null;
  status: AnalysisJobStatus;
  provider: string;
  modelName: string | null;
  startedAt: TimestampString | null;
  completedAt: TimestampString | null;
  failedAt: TimestampString | null;
  errorMessage: string | null;
  inputSnapshot: Record<string, unknown>;
  outputSnapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// game_reports
// ---------------------------------------------------------------------------
export interface GameReport {
  id: ID;
  teamId: ID;
  gameId: ID;
  analysisJobId: ID | null;
  createdBy: ID | null;
  title: string;
  executiveSummary: string | null;
  overallConfidence: ConfidenceLevel;
  reportVersion: number;
  isCurrent: boolean;
  aiGenerated: boolean;
  rawAiOutput: Record<string, unknown>;
  editedOutput: Record<string, unknown> | null;
  assumptions: string[];
  limitations: string[];
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// coaching_insights
// ---------------------------------------------------------------------------
export interface EvidenceItem {
  id: string;
  type:
    | "timestamp"
    | "coach_note"
    | "opponent_note"
    | "game_metadata"
    | "roster"
    | "video_status"
    | "manual_input"
    | "stat"
    | "video";
  label: string;
  description?: string;
  timestampSeconds?: number;
  eventId?: string;
  playerIds?: string[];
}

export interface CoachingInsight {
  id: ID;
  teamId: ID;
  gameId: ID;
  gameReportId: ID;
  title: string;
  summary: string;
  whyItMatters: string | null;
  recommendedAction: string | null;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  evidence: EvidenceItem[];
  assumptions: string[];
  affectedPlayerIds: ID[];
  relatedEventIds: ID[];
  sortOrder: number;
  isEdited: boolean;
  originalAiContent: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// player_reports
// ---------------------------------------------------------------------------
export interface PlayerKeyMoment {
  timestampId?: ID;
  description: string;
  significance: string;
}

export interface PlayerReport {
  id: ID;
  teamId: ID;
  gameId: ID;
  gameReportId: ID;
  playerId: ID | null;
  playerDisplayName: string | null;
  summary: string | null;
  strengths: string[];
  improvementAreas: string[];
  keyMoments: PlayerKeyMoment[];
  recommendedFocus: string | null;
  playerFacingSummary: string | null;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  isEdited: boolean;
  originalAiContent: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// practice_recommendations
// ---------------------------------------------------------------------------
export interface PracticeRecommendation {
  id: ID;
  teamId: ID;
  gameId: ID;
  gameReportId: ID;
  title: string;
  priority: number;
  description: string | null;
  drillName: string | null;
  durationMinutes: number | null;
  coachingPoints: string[];
  playerIds: ID[];
  relatedInsightIds: ID[];
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  isEdited: boolean;
  originalAiContent: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// opponent_tendencies
// ---------------------------------------------------------------------------
export interface OpponentTendency {
  id: ID;
  teamId: ID;
  gameId: ID;
  gameReportId: ID;
  title: string;
  description: string;
  evidence: EvidenceItem[];
  recommendedResponse: string | null;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
  isEdited: boolean;
  originalAiContent: Record<string, unknown> | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// verification_feedback
// ---------------------------------------------------------------------------
export type VerificationTargetType =
  | "coaching_insight"
  | "player_report"
  | "practice_recommendation"
  | "opponent_tendency"
  | "game_report";

export interface VerificationFeedback {
  id: ID;
  teamId: ID;
  gameId: ID | null;
  gameReportId: ID | null;
  submittedBy: ID | null;
  targetType: VerificationTargetType;
  targetId: ID;
  verificationStatus: VerificationStatus;
  feedbackText: string | null;
  correctionText: string | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
}

// ---------------------------------------------------------------------------
// share_links
// ---------------------------------------------------------------------------
export interface ShareLink {
  id: ID;
  teamId: ID;
  gameId: ID | null;
  gameReportId: ID | null;
  createdBy: ID | null;
  token: string;
  visibility: ShareVisibility;
  allowedPlayerId: ID | null;
  expiresAt: TimestampString | null;
  revokedAt: TimestampString | null;
  viewCount: number;
  lastViewedAt: TimestampString | null;
  metadata: Record<string, unknown>;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

// ---------------------------------------------------------------------------
// exports
// ---------------------------------------------------------------------------
export type { ExportRecord } from "./export";

// ---------------------------------------------------------------------------
// Composed / enriched types for UI use
// ---------------------------------------------------------------------------
export interface GameWithVideo extends Game {
  primaryVideo: VideoAsset | null;
}

export interface GameReportFull extends GameReport {
  insights: CoachingInsight[];
  playerReports: PlayerReport[];
  practiceRecommendations: PracticeRecommendation[];
  opponentTendencies: OpponentTendency[];
}
