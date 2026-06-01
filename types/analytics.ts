/**
 * types/analytics.ts — Types for product event tracking.
 * Lightweight, first-party, privacy-conscious.
 */

export type ProductEventCategory =
  | "landing"
  | "auth"
  | "onboarding"
  | "team"
  | "roster"
  | "game"
  | "video"
  | "timestamp"
  | "analysis"
  | "report"
  | "verification"
  | "sharing"
  | "export"
  | "feedback"
  | "demo";

export interface TrackEventInput {
  eventName: string;
  eventCategory: ProductEventCategory;
  userId?: string | null;
  teamId?: string | null;
  gameId?: string | null;
  reportId?: string | null;
  source?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductEvent {
  id: string;
  userId?: string | null;
  teamId?: string | null;
  gameId?: string | null;
  reportId?: string | null;
  eventName: string;
  eventCategory: ProductEventCategory;
  source?: string | null;
  pagePath?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalUsers: number;
  totalTeams: number;
  totalGames: number;
  totalReports: number;
  totalShareLinks: number;
  totalExports: number;
  totalFeedback: number;
  totalAccessRequests: number;
  totalProductEvents: number;
}

export interface FunnelStep {
  step: number;
  label: string;
  eventName: string;
  count: number;
}

export interface RecentEventRow {
  id: string;
  eventName: string;
  eventCategory: string;
  userId: string | null;
  teamId: string | null;
  gameId: string | null;
  reportId: string | null;
  source: string | null;
  pagePath: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
