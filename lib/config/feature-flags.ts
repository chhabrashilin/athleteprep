/**
 * GameIQ Feature Flags
 *
 * All feature flags are read from NEXT_PUBLIC_* environment variables so
 * they are available in both server and client components without a separate
 * server round-trip.
 *
 * Pilot-safe defaults:
 *   - Mock data:        OFF in production (enable only for founder demo deployments)
 *   - Real AI:         OFF until intentionally enabled with a cost cap in place
 *   - Video processing: OFF (not yet implemented)
 *   - Founder analytics: ON for admin users (gated separately by ADMIN_EMAILS)
 *   - Public feedback:  ON (coaches and visitors can submit feedback)
 *   - Pilot mode:       ON when NEXT_PUBLIC_PILOT_MODE=true
 *   - Multi-sport:      ON — shows sport selection and sport registry
 *   - Cricket:          ON — enables Cricket Hub and foundation routes
 *   - Cricket sub-features: OFF — enabled per-module as each ships
 *
 * Usage:
 *   import { flags } from "@/lib/config/feature-flags";
 *   if (flags.enableMockData) { ... }
 *
 *   // Named function exports (for cricket flags):
 *   import { isCricketEnabled } from "@/lib/config/feature-flags";
 */

export function getFeatureFlag(envVar: string, fallback = false): boolean {
  const val = process.env[envVar];
  if (val === undefined) return fallback;
  return val === "true";
}

// Kept as internal alias so existing callers of boolFlag-style logic still work.
function boolFlag(envVar: string, fallback = false): boolean {
  return getFeatureFlag(envVar, fallback);
}

export interface FeatureFlags {
  /**
   * Enable the demo workspace creation flow (/demo/setup) and show the
   * "Create demo workspace" button on the dashboard.
   * Set true only in founder demo deployments. Off by default in production.
   */
  enableMockData: boolean;

  /**
   * Route AI report generation to the real provider (OpenAI, etc.) instead of
   * the zero-cost mock. Requires AI_PROVIDER + matching API key to be set.
   * Off by default — enable only when cost caps are confirmed in the provider
   * dashboard.
   */
  enableRealAI: boolean;

  /**
   * Enable server-side FFmpeg video metadata extraction (duration, thumbnails).
   * Off — not implemented in v1. Enabling has no effect until the pipeline exists.
   */
  enableVideoProcessing: boolean;

  /**
   * Show the admin analytics dashboard (/admin/analytics) and feedback review
   * (/admin/feedback) links in the settings nav. Access is still gated by the
   * ADMIN_EMAILS env var — this flag only controls UI visibility.
   * On by default so founders always see the links.
   */
  enableFounderAnalytics: boolean;

  /**
   * Show the public feedback form (/feedback) and request-access form
   * (/request-access) in the landing page CTAs and nav.
   * On by default — collecting coach feedback is always valuable.
   */
  enablePublicFeedback: boolean;

  /**
   * Show a subtle "Pilot MVP" badge in the app header and footer to remind
   * coaches that this is an early-access product. Useful during structured
   * pilot sessions to set expectations proactively.
   */
  enablePilotMode: boolean;

  /** Enable multi-sport platform mode: sport selection page and sport registry. */
  multiSportEnabled: boolean;

  /** Enable the Cricket Hub (/cricket) and all cricket foundation routes. */
  cricketEnabled: boolean;

  /** Cricket social/community feed — not yet implemented. */
  cricketSocialEnabled: boolean;

  /** Cricket live streaming overlay integration. */
  cricketStreamingEnabled: boolean;

  /** Cricket broadcast overlay system (OBS/vMix browser sources). */
  cricketBroadcastOverlaysEnabled: boolean;

  /** Cricket equipment/merchandise marketplace. */
  cricketMarketplaceEnabled: boolean;

  /** Cricket news, trivia, and polls. */
  cricketNewsEnabled: boolean;

  /** Ball-by-ball live scoring interface. */
  cricketLiveScoringEnabled: boolean;

  /** Advanced analytics: wagon wheel, Manhattan graph, worm chart. */
  cricketAdvancedAnalyticsEnabled: boolean;

  // ─── Prompt 37 — Community & Fan Engagement ─────────────────────────────────

  /** Community spaces, posts, comments, reactions, announcements, and feeds. */
  cricketCommunityEnabled: boolean;

  /** Fan polls: create, vote, close, and display results. */
  cricketPollsEnabled: boolean;

  /** Per-match fan discussion threads with moderation and slow-mode. */
  cricketMatchThreadsEnabled: boolean;

  /** In-app notification center. No external provider required. */
  cricketInAppNotificationsEnabled: boolean;

  // ─── Prompt 38 — Commerce & Marketplace ─────────────────────────────────────

  /** Team kit inquiry/order request flow. */
  cricketTeamKitOrdersEnabled: boolean;

  /** Sponsorship package listings and inquiries. */
  cricketSponsorshipEnabled: boolean;

  /** Vendor self-service portal (apply, manage products, view orders). */
  cricketVendorPortalEnabled: boolean;
}

export const flags: FeatureFlags = {
  enableMockData: boolFlag("NEXT_PUBLIC_ENABLE_MOCK_DATA", false),
  enableRealAI: boolFlag("NEXT_PUBLIC_ENABLE_REAL_AI", false),
  enableVideoProcessing: boolFlag("NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING", false),
  enableFounderAnalytics: boolFlag("NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS", true),
  enablePublicFeedback: boolFlag("NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK", true),
  enablePilotMode: boolFlag("NEXT_PUBLIC_PILOT_MODE", false),
  multiSportEnabled: boolFlag("NEXT_PUBLIC_MULTI_SPORT_ENABLED", true),
  cricketEnabled: boolFlag("NEXT_PUBLIC_CRICKET_ENABLED", true),
  cricketSocialEnabled: boolFlag("NEXT_PUBLIC_CRICKET_SOCIAL_ENABLED", false),
  cricketStreamingEnabled: boolFlag("NEXT_PUBLIC_CRICKET_STREAMING_ENABLED", true),
  cricketBroadcastOverlaysEnabled: boolFlag("NEXT_PUBLIC_CRICKET_BROADCAST_OVERLAYS_ENABLED", true),
  cricketMarketplaceEnabled: boolFlag("NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED", true),
  cricketNewsEnabled: boolFlag("NEXT_PUBLIC_CRICKET_NEWS_ENABLED", false),
  cricketLiveScoringEnabled: boolFlag("NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED", false),
  cricketAdvancedAnalyticsEnabled: boolFlag(
    "NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED",
    false
  ),
  cricketCommunityEnabled: boolFlag("NEXT_PUBLIC_CRICKET_COMMUNITY_ENABLED", true),
  cricketPollsEnabled: boolFlag("NEXT_PUBLIC_CRICKET_POLLS_ENABLED", true),
  cricketMatchThreadsEnabled: boolFlag("NEXT_PUBLIC_CRICKET_MATCH_THREADS_ENABLED", true),
  cricketInAppNotificationsEnabled: boolFlag("NEXT_PUBLIC_CRICKET_IN_APP_NOTIFICATIONS_ENABLED", true),
  cricketTeamKitOrdersEnabled: boolFlag("NEXT_PUBLIC_CRICKET_TEAM_KIT_ORDERS_ENABLED", true),
  cricketSponsorshipEnabled: boolFlag("NEXT_PUBLIC_CRICKET_SPONSORSHIP_ENABLED", true),
  cricketVendorPortalEnabled: boolFlag("NEXT_PUBLIC_CRICKET_VENDOR_PORTAL_ENABLED", true),
};

// ─── Named re-exports (existing flags) ────────────────────────────────────────

export const {
  enableMockData,
  enableRealAI,
  enableVideoProcessing,
  enableFounderAnalytics,
  enablePublicFeedback,
  enablePilotMode,
} = flags;

// ─── Named function exports (cricket flags) ────────────────────────────────────
// These wrap the flags object so they are tree-shakeable and easy to mock in tests.

export function isMultiSportEnabled(): boolean {
  return flags.multiSportEnabled;
}

export function isCricketEnabled(): boolean {
  return flags.cricketEnabled;
}

export function isCricketSocialEnabled(): boolean {
  return flags.cricketSocialEnabled;
}

export function isCricketStreamingEnabled(): boolean {
  return flags.cricketStreamingEnabled;
}

export function isCricketBroadcastOverlaysEnabled(): boolean {
  return flags.cricketBroadcastOverlaysEnabled;
}

export function isCricketMarketplaceEnabled(): boolean {
  return flags.cricketMarketplaceEnabled;
}

export function isCricketNewsEnabled(): boolean {
  return flags.cricketNewsEnabled;
}

export function isCricketLiveScoringEnabled(): boolean {
  return flags.cricketLiveScoringEnabled;
}

export function isCricketAdvancedAnalyticsEnabled(): boolean {
  return flags.cricketAdvancedAnalyticsEnabled;
}

export function isCricketCommunityEnabled(): boolean {
  return flags.cricketCommunityEnabled;
}

export function isCricketPollsEnabled(): boolean {
  return flags.cricketPollsEnabled;
}

export function isCricketMatchThreadsEnabled(): boolean {
  return flags.cricketMatchThreadsEnabled;
}

export function isCricketInAppNotificationsEnabled(): boolean {
  return flags.cricketInAppNotificationsEnabled;
}

// ─── Prompt 38 — Commerce function exports ────────────────────────────────────

export function isCricketTeamKitOrdersEnabled(): boolean {
  return flags.cricketTeamKitOrdersEnabled;
}

export function isCricketSponsorshipEnabled(): boolean {
  return flags.cricketSponsorshipEnabled;
}

export function isCricketVendorPortalEnabled(): boolean {
  return flags.cricketVendorPortalEnabled;
}

/** Returns the server-side commerce mode based on env config. */
export function getCommerceCheckoutProvider(): "request_only" | "stripe" | "unknown" {
  const provider = process.env.CRICKET_CHECKOUT_PROVIDER ?? "request_only";
  if (provider === "stripe") return "stripe";
  return "request_only";
}

export function isCricketPaymentsEnabled(): boolean {
  return process.env.CRICKET_PAYMENTS_ENABLED === "true";
}
