/**
 * lib/analytics/track.ts — Product event tracking service.
 *
 * Design principles:
 *  - Fire-and-forget: never block product flows. Always call with void.
 *  - Fail silently: swallows all errors so analytics never surfaces to users.
 *  - Privacy-first: never store coach notes, player feedback, AI content, or secrets.
 *  - Server-safe: runs in Server Actions, Route Handlers, and server components.
 *  - Metadata safe: only IDs, counts, statuses, enums — never free-text content.
 *
 * Usage:
 *   void trackEvent({ eventName: "team_created", eventCategory: "team", userId, teamId });
 */
import { insertProductEvent } from "@/lib/db/product-events";
import type { TrackEventInput } from "@/types/analytics";

export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await insertProductEvent(input);
  } catch {
    // Swallow all errors — analytics must never surface to users.
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers for common events
// These accept only safe, pre-defined fields. Never accept free-text content.
// ---------------------------------------------------------------------------

export async function trackTeamCreated(
  userId: string,
  teamId: string,
  metadata: { sport: string }
): Promise<void> {
  void trackEvent({ eventName: "team_created", eventCategory: "team", userId, teamId, metadata });
}

export async function trackPlayerCreated(
  userId: string,
  teamId: string
): Promise<void> {
  void trackEvent({ eventName: "player_created", eventCategory: "roster", userId, teamId });
}

export async function trackGameCreated(
  userId: string,
  teamId: string,
  gameId: string,
  metadata: { sport: string; gameType: string }
): Promise<void> {
  void trackEvent({ eventName: "game_created", eventCategory: "game", userId, teamId, gameId, metadata });
}

export async function trackTimestampCreated(
  userId: string,
  teamId: string,
  gameId: string
): Promise<void> {
  void trackEvent({ eventName: "timestamp_created", eventCategory: "timestamp", userId, teamId, gameId });
}

export async function trackAnalysisStarted(
  userId: string,
  teamId: string,
  gameId: string,
  metadata: { provider: string }
): Promise<void> {
  void trackEvent({ eventName: "analysis_started", eventCategory: "analysis", userId, teamId, gameId, metadata });
}

export async function trackAnalysisCompleted(
  userId: string,
  teamId: string,
  gameId: string,
  reportId: string,
  metadata: { provider: string; confidence: string; version: number }
): Promise<void> {
  void trackEvent({
    eventName: "analysis_completed",
    eventCategory: "analysis",
    userId,
    teamId,
    gameId,
    reportId,
    metadata,
  });
}

export async function trackAnalysisFailed(
  userId: string,
  teamId: string,
  gameId: string,
  metadata: { provider: string; reason: string }
): Promise<void> {
  void trackEvent({ eventName: "analysis_failed", eventCategory: "analysis", userId, teamId, gameId, metadata });
}

export async function trackInsightVerified(
  userId: string,
  teamId: string,
  gameId: string,
  metadata: { status: string; targetType: string }
): Promise<void> {
  void trackEvent({ eventName: "insight_verified", eventCategory: "verification", userId, teamId, gameId, metadata });
}

export async function trackInsightEdited(
  userId: string,
  teamId: string,
  gameId: string,
  metadata: { targetType: string }
): Promise<void> {
  void trackEvent({ eventName: "insight_edited", eventCategory: "verification", userId, teamId, gameId, metadata });
}

export async function trackShareLinkCreated(
  userId: string,
  teamId: string,
  gameId: string,
  reportId: string,
  metadata: { visibility: string }
): Promise<void> {
  void trackEvent({ eventName: "share_link_created", eventCategory: "sharing", userId, teamId, gameId, reportId, metadata });
}

export async function trackShareLinkViewed(
  teamId: string,
  gameId: string,
  reportId: string,
  metadata: { visibility: string }
): Promise<void> {
  void trackEvent({ eventName: "share_link_viewed", eventCategory: "sharing", teamId, gameId, reportId, metadata });
}

export async function trackReportExportOpened(
  userId: string,
  teamId: string,
  gameId: string,
  reportId: string,
  metadata: { sectionCount: number }
): Promise<void> {
  void trackEvent({ eventName: "report_export_opened", eventCategory: "export", userId, teamId, gameId, reportId, metadata });
}

export async function trackRequestAccessSubmitted(
  metadata: { role: string; sport?: string; hasPainPoint: boolean }
): Promise<void> {
  void trackEvent({ eventName: "request_access_submitted", eventCategory: "feedback", metadata });
}

export async function trackFeedbackSubmitted(
  userId: string | null | undefined,
  metadata: { role?: string; sport?: string; usefulnessRating?: number; hasWtp: boolean }
): Promise<void> {
  void trackEvent({ eventName: "feedback_submitted", eventCategory: "feedback", userId, metadata });
}

export async function trackDemoWorkspaceCreated(
  userId: string,
  teamId: string,
  metadata: { sport: string; playerCount: number; eventCount: number }
): Promise<void> {
  void trackEvent({ eventName: "demo_workspace_created", eventCategory: "demo", userId, teamId, metadata });
}

export async function trackLoginCompleted(userId: string): Promise<void> {
  void trackEvent({ eventName: "login_completed", eventCategory: "auth", userId });
}

export async function trackDashboardViewed(userId: string): Promise<void> {
  void trackEvent({ eventName: "dashboard_viewed", eventCategory: "onboarding", userId });
}
