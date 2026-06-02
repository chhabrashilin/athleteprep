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
 *
 * Usage:
 *   import { flags } from "@/lib/config/feature-flags";
 *   if (flags.enableMockData) { ... }
 */

function boolFlag(envVar: string, fallback = false): boolean {
  const val = process.env[envVar];
  if (val === undefined) return fallback;
  return val === "true";
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
}

export const flags: FeatureFlags = {
  enableMockData: boolFlag("NEXT_PUBLIC_ENABLE_MOCK_DATA", false),
  enableRealAI: boolFlag("NEXT_PUBLIC_ENABLE_REAL_AI", false),
  enableVideoProcessing: boolFlag("NEXT_PUBLIC_ENABLE_VIDEO_PROCESSING", false),
  enableFounderAnalytics: boolFlag("NEXT_PUBLIC_ENABLE_FOUNDER_ANALYTICS", true),
  enablePublicFeedback: boolFlag("NEXT_PUBLIC_ENABLE_PUBLIC_FEEDBACK", true),
  enablePilotMode: boolFlag("NEXT_PUBLIC_PILOT_MODE", false),
};

// Named re-exports for convenient destructuring
export const {
  enableMockData,
  enableRealAI,
  enableVideoProcessing,
  enableFounderAnalytics,
  enablePublicFeedback,
  enablePilotMode,
} = flags;
