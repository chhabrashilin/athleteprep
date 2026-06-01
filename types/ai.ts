import type { ConfidenceLevel, VerificationStatus, ID } from "./core";

export interface EvidenceReference {
  id: string;
  type: "timestamp" | "coach_note" | "stat" | "manual_input" | "video";
  label: string;
  description?: string;
  timestampSeconds?: number;
}

export interface CoachingInsightDraft {
  id: ID;
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceReference[];
  assumptions: string[];
  affectedPlayerIds?: ID[];
  verificationStatus: VerificationStatus;
  editedContent?: string | null;
}

export interface PlayerReportDraft {
  playerId: ID;
  playerName: string;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  keyMoments: Array<{
    timestampId?: ID;
    description: string;
    significance: string;
  }>;
  recommendedFocus: string;
  confidence: ConfidenceLevel;
  assumptions: string[];
  dataCoverage: string;
}

export interface PracticeRecommendationDraft {
  id: ID;
  title: string;
  description: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  targetPlayerIds: ID[];
  linkedInsightIds: ID[];
  drillSuggestions: string[];
  confidence: ConfidenceLevel;
}

export interface OpponentTendencyDraft {
  id: ID;
  title: string;
  description: string;
  evidence: EvidenceReference[];
  confidence: ConfidenceLevel;
  strategicImplication: string;
}

export interface GameReportDraft {
  id: ID;
  gameId: ID;
  executiveSummary: string;
  topInsights: CoachingInsightDraft[];
  playerReports: PlayerReportDraft[];
  practiceRecommendations: PracticeRecommendationDraft[];
  opponentTendencies: OpponentTendencyDraft[];
  overallConfidence: ConfidenceLevel;
  dataQualityNotes: string[];
  generatedAt: string;
  provider: string;
}
