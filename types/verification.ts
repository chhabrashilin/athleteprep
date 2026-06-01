import type { VerificationStatus } from "./core";
import type { VerificationTargetType } from "./database";

export type { VerificationTargetType, VerificationStatus };

// ---------------------------------------------------------------------------
// Verification input
// ---------------------------------------------------------------------------

export interface SubmitVerificationFeedbackInput {
  teamId: string;
  gameId?: string;
  gameReportId?: string;
  targetType: VerificationTargetType;
  targetId: string;
  verificationStatus: VerificationStatus;
  feedbackText?: string;
  correctionText?: string;
}

// ---------------------------------------------------------------------------
// Edit input types for each editable entity
// ---------------------------------------------------------------------------

export interface UpdateCoachingInsightInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  insightId: string;
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  assumptions: string[];
  correctionText?: string;
}

export interface UpdatePlayerReportInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  reportId: string;
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  recommendedFocus: string;
  playerFacingSummary: string;
  correctionText?: string;
}

export interface UpdatePracticeRecommendationInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  recommendationId: string;
  title: string;
  description: string;
  drillName: string;
  durationMinutes: number | null;
  coachingPoints: string[];
  correctionText?: string;
}

export interface UpdateOpponentTendencyInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  tendencyId: string;
  title: string;
  description: string;
  recommendedResponse: string;
  tags: string[];
  correctionText?: string;
}

export interface UpdateGameReportSummaryInput {
  teamId: string;
  gameId: string;
  reportId: string;
  title: string;
  executiveSummary: string;
  assumptions: string[];
  limitations: string[];
  correctionText?: string;
}

// ---------------------------------------------------------------------------
// Action result
// ---------------------------------------------------------------------------

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };
