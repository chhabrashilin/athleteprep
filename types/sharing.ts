import type { ShareVisibility } from "./core";
import type { ConfidenceLevel } from "./core";

export type { ShareVisibility };

// ---------------------------------------------------------------------------
// Share link entity
// ---------------------------------------------------------------------------

export interface ShareLink {
  id: string;
  teamId: string;
  gameId: string | null;
  gameReportId: string | null;
  createdBy: string | null;
  token: string;
  visibility: ShareVisibility;
  allowedPlayerId: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateShareLinkInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  visibility: ShareVisibility;
  allowedPlayerId?: string | null;
  expiresAt?: string | null;
}

// ---------------------------------------------------------------------------
// Shared view model — sanitized, server-side only
// ---------------------------------------------------------------------------

export interface SharedInsight {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string | null;
  recommendedAction: string | null;
  confidence: ConfidenceLevel;
  isEdited: boolean;
}

export interface SharedPlayerReport {
  id: string;
  playerDisplayName: string | null;
  summary: string | null;
  strengths: string[];
  improvementAreas: string[];
  recommendedFocus: string | null;
  playerFacingSummary: string | null;
  confidence: ConfidenceLevel;
}

export interface SharedPracticeRecommendation {
  id: string;
  title: string;
  description: string | null;
  drillName: string | null;
  durationMinutes: number | null;
  coachingPoints: string[];
  priority: number;
  confidence: ConfidenceLevel;
  playerIds: string[];
}

export interface SharedOpponentTendency {
  id: string;
  title: string;
  description: string;
  recommendedResponse: string | null;
  tags: string[];
  confidence: ConfidenceLevel;
}

export interface SharedGameContext {
  title: string;
  sport: string;
  opponentName: string | null;
  gameDate: string | null;
  result: string | null;
  homeAway: string;
}

export interface SharedReportViewModel {
  shareLink: ShareLink;
  visibility: ShareVisibility;
  reportTitle: string;
  reportCreatedAt: string;
  overallConfidence: ConfidenceLevel;
  gameContext: SharedGameContext;
  executiveSummary: string | null;
  coachingInsights: SharedInsight[];
  playerReports: SharedPlayerReport[];
  practiceRecommendations: SharedPracticeRecommendation[];
  opponentTendencies: SharedOpponentTendency[];
  assumptions: string[];
  limitations: string[];
  canShowVideo: boolean;
  allowedPlayerId: string | null;
}

// ---------------------------------------------------------------------------
// Share link status (derived)
// ---------------------------------------------------------------------------

export type ShareLinkStatus = "active" | "expired" | "revoked";

export function getShareLinkStatus(link: ShareLink): ShareLinkStatus {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return "expired";
  return "active";
}
