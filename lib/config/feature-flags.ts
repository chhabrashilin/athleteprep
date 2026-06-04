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

  /** Cricket live streaming overlay integration — not yet implemented. */
  cricketStreamingEnabled: boolean;

  /** Cricket equipment/merchandise marketplace — not yet implemented. */
  cricketMarketplaceEnabled: boolean;

  /** Cricket news, trivia, and polls — not yet implemented. */
  cricketNewsEnabled: boolean;

  /** Ball-by-ball live scoring interface — not yet implemented. */
  cricketLiveScoringEnabled: boolean;

  /** Advanced analytics: wagon wheel, Manhattan graph, worm chart — not yet implemented. */
  cricketAdvancedAnalyticsEnabled: boolean;
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
  cricketStreamingEnabled: boolFlag("NEXT_PUBLIC_CRICKET_STREAMING_ENABLED", false),
  cricketMarketplaceEnabled: boolFlag("NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED", false),
  cricketNewsEnabled: boolFlag("NEXT_PUBLIC_CRICKET_NEWS_ENABLED", false),
  cricketLiveScoringEnabled: boolFlag("NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED", false),
  cricketAdvancedAnalyticsEnabled: boolFlag(
    "NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED",
    false
  ),
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
