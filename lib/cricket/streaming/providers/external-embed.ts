/**
 * external_embed provider — configured when an embed/public URL is present.
 * No API calls; just metadata passthrough.
 */

import type { StreamProviderAdapter, StreamConfig, ProviderResult, ProviderStreamRef, ProviderHealthResult } from "./types";

export function createExternalEmbedProvider(embedUrl?: string | null, watchUrl?: string | null): StreamProviderAdapter {
  return {
    providerKey: "external_embed",

    isConfigured(): boolean {
      return !!(embedUrl || watchUrl);
    },

    async createStream(_config: StreamConfig): Promise<ProviderResult<ProviderStreamRef>> {
      if (!embedUrl && !watchUrl) {
        return { success: false, error: "external_embed requires an embed_url or public_watch_url" };
      }
      return {
        success: true,
        data: {
          providerStreamId: "external_embed",
          watchUrl: watchUrl ?? null,
          embedUrl: embedUrl ?? null,
          rtmpIngestUrl: null,
        },
      };
    },

    async updateStream(_id: string, _config: StreamConfig): Promise<ProviderResult> {
      return { success: true };
    },

    async startStream(_id: string): Promise<ProviderResult> {
      return { success: true };
    },

    async endStream(_id: string): Promise<ProviderResult> {
      return { success: true };
    },

    async getHealth(_id: string): Promise<ProviderResult<ProviderHealthResult>> {
      return {
        success: true,
        data: {
          status: "unknown",
          message: "External embed provider does not report health. Check your stream source manually.",
        },
      };
    },
  };
}
