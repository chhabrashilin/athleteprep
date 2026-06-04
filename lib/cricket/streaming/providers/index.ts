/**
 * lib/cricket/streaming/providers/index.ts
 * Registry for stream provider adapters.
 */

import type { StreamProviderAdapter } from "./types";
import { overlayOnlyProvider } from "./overlay-only";
import { createExternalEmbedProvider } from "./external-embed";

export type { StreamProviderAdapter } from "./types";

// ─── Disabled provider stub ───────────────────────────────────────────────────

function createDisabledProvider(key: string, reason: string): StreamProviderAdapter {
  const err = `Provider adapter not configured: ${reason}`;
  return {
    providerKey: key,
    isConfigured: () => false,
    createStream: async () => ({ success: false, error: err }),
    updateStream: async () => ({ success: false, error: err }),
    startStream: async () => ({ success: false, error: err }),
    endStream: async () => ({ success: false, error: err }),
    getHealth: async () => ({ success: false, error: err }),
  };
}

// ─── getProviderAdapter ───────────────────────────────────────────────────────

export function getProviderAdapter(
  provider: string,
  options?: { embedUrl?: string | null; watchUrl?: string | null }
): StreamProviderAdapter {
  switch (provider) {
    case "overlay_only":
      return overlayOnlyProvider;

    case "external_embed":
      return createExternalEmbedProvider(options?.embedUrl, options?.watchUrl);

    case "custom_rtmp": {
      const ingestUrl = process.env.CRICKET_STREAM_RTMP_INGEST_URL;
      if (!ingestUrl) {
        return createDisabledProvider(
          "custom_rtmp",
          "CRICKET_STREAM_RTMP_INGEST_URL is not set. Configure this environment variable to enable custom RTMP."
        );
      }
      // Custom RTMP is overlay-only at the app level; the operator pushes via OBS/vMix.
      return overlayOnlyProvider;
    }

    case "youtube": {
      const enabled = process.env.YOUTUBE_LIVE_ENABLED === "true";
      if (!enabled || !process.env.YOUTUBE_CLIENT_ID) {
        return createDisabledProvider(
          "youtube",
          "YouTube Live integration is disabled. Set YOUTUBE_LIVE_ENABLED=true and configure YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET."
        );
      }
      return createDisabledProvider("youtube", "YouTube Live adapter not yet implemented.");
    }

    case "twitch": {
      const enabled = process.env.TWITCH_LIVE_ENABLED === "true";
      if (!enabled || !process.env.TWITCH_CLIENT_ID) {
        return createDisabledProvider(
          "twitch",
          "Twitch integration is disabled. Set TWITCH_LIVE_ENABLED=true and configure TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET."
        );
      }
      return createDisabledProvider("twitch", "Twitch adapter not yet implemented.");
    }

    default:
      return createDisabledProvider(provider, `Unknown provider: ${provider}`);
  }
}
