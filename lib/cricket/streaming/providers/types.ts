/**
 * lib/cricket/streaming/providers/types.ts
 * Provider adapter interface for cricket streaming integrations.
 */

export interface StreamConfig {
  title: string;
  description?: string | null;
  scheduledStart?: string | null;
  visibility?: string;
}

export interface ProviderStreamRef {
  providerStreamId: string;
  watchUrl?: string | null;
  embedUrl?: string | null;
  rtmpIngestUrl?: string | null;
}

export interface ProviderHealthResult {
  status: "healthy" | "warning" | "critical" | "offline" | "unknown";
  latencyMs?: number | null;
  bitrateKbps?: number | null;
  viewerCount?: number | null;
  message?: string | null;
}

export interface ProviderResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StreamProviderAdapter {
  readonly providerKey: string;
  isConfigured(): boolean;
  createStream(config: StreamConfig): Promise<ProviderResult<ProviderStreamRef>>;
  updateStream(providerStreamId: string, config: StreamConfig): Promise<ProviderResult>;
  startStream(providerStreamId: string): Promise<ProviderResult>;
  endStream(providerStreamId: string): Promise<ProviderResult>;
  getHealth(providerStreamId: string): Promise<ProviderResult<ProviderHealthResult>>;
}
