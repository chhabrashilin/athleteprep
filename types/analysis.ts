import type { ConfidenceLevel } from "./core";

// ---------------------------------------------------------------------------
// Analysis Input Snapshot
// Collected from the database and stored verbatim on the analysis_jobs row.
// ---------------------------------------------------------------------------

export interface AnalysisRosterPlayer {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  jerseyNumber: string | null;
  position: string | null;
  role: string | null;
  status: string | null;
  notes: string | null;
}

export interface AnalysisVideoSummary {
  id: string;
  fileName: string;
  durationSeconds: number | null;
  uploadStatus: string;
  processingStatus: string;
}

export interface AnalysisEvent {
  id: string;
  timestampSeconds: number;
  endTimestampSeconds: number | null;
  label: string;
  eventType: string | null;
  teamContext: string | null;
  description: string | null;
  importance: string;
  tags: string[];
  playerIds: string[];
  playerNames: string[];
  opponentPlayerNames: string[];
}

export interface AnalysisInputSnapshot {
  team: {
    id: string;
    name: string;
    sport: string;
    organizationName: string | null;
    level: string | null;
  };
  game: {
    id: string;
    title: string;
    sport: string;
    gameType: string;
    opponentName: string | null;
    gameDate: string | null;
    homeAway: string | null;
    venue: string | null;
    competitionName: string | null;
    teamScore: string | null;
    opponentScore: string | null;
    result: string | null;
    summaryNotes: string | null;
    coachNotes: string | null;
    opponentNotes: string | null;
  };
  roster: AnalysisRosterPlayer[];
  video: AnalysisVideoSummary | null;
  events: AnalysisEvent[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Analysis Readiness
// ---------------------------------------------------------------------------

export interface AnalysisReadiness {
  status: "not_ready" | "needs_context" | "ready" | "strong";
  canGenerate: boolean;
  reasons: string[];
  warnings: string[];
  completedChecks: {
    gameDetails: boolean;
    roster: boolean;
    video: boolean;
    events: boolean;
    notes: boolean;
  };
}

// ---------------------------------------------------------------------------
// Generated Report Output
// Returned by the AI generator, then persisted to the database.
// ---------------------------------------------------------------------------

export interface EvidenceReference {
  id: string;
  type: "timestamp" | "coach_note" | "opponent_note" | "game_metadata" | "roster" | "video_status" | "manual_input";
  label: string;
  description?: string;
  timestampSeconds?: number;
  eventId?: string;
  playerIds?: string[];
}

export interface GeneratedCoachingInsight {
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceReference[];
  assumptions: string[];
  affectedPlayerIds: string[];
  relatedEventIds: string[];
  sortOrder: number;
}

export interface GeneratedPlayerKeyMoment {
  description: string;
  significance: string;
  eventId?: string;
  timestampSeconds?: number;
}

export interface GeneratedPlayerReport {
  playerId: string | null;
  playerDisplayName: string;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  keyMoments: GeneratedPlayerKeyMoment[];
  recommendedFocus: string;
  playerFacingSummary: string;
  confidence: ConfidenceLevel;
  dataCoverage: string;
}

export interface GeneratedPracticeRecommendation {
  title: string;
  priority: number;
  description: string;
  drillName: string;
  durationMinutes: number;
  coachingPoints: string[];
  playerIds: string[];
  confidence: ConfidenceLevel;
}

export interface GeneratedOpponentTendency {
  title: string;
  description: string;
  evidence: EvidenceReference[];
  recommendedResponse: string;
  confidence: ConfidenceLevel;
  tags: string[];
}

export interface GeneratedGameReport {
  title: string;
  executiveSummary: string;
  overallConfidence: ConfidenceLevel;
  assumptions: string[];
  limitations: string[];
  coachingInsights: GeneratedCoachingInsight[];
  playerReports: GeneratedPlayerReport[];
  practiceRecommendations: GeneratedPracticeRecommendation[];
  opponentTendencies: GeneratedOpponentTendency[];
}

// ---------------------------------------------------------------------------
// Generate Report Result — returned by generate-report.ts
// ---------------------------------------------------------------------------

export interface GenerateReportResult {
  success: true;
  reportId: string;
  jobId: string;
  version: number;
}

export interface GenerateReportError {
  success: false;
  error: string;
  jobId?: string;
}
