/**
 * overlay_only provider — always configured, no external video stream.
 * Supports overlay URLs and watch page metadata only.
 */

import type { StreamProviderAdapter, StreamConfig, ProviderResult, ProviderStreamRef, ProviderHealthResult } from "./types";

export const overlayOnlyProvider: StreamProviderAdapter = {
  providerKey: "overlay_only",

  isConfigured(): boolean {
    return true;
  },

  async createStream(_config: StreamConfig): Promise<ProviderResult<ProviderStreamRef>> {
    return {
      success: true,
      data: {
        providerStreamId: "overlay_only",
        watchUrl: null,
        embedUrl: null,
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
        status: "healthy",
        message: "Overlay-only mode. No external video stream configured.",
      },
    };
  },
};
