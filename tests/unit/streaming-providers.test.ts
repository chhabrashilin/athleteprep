/**
 * tests/unit/streaming-providers.test.ts
 * Tests for provider adapter architecture.
 */

import { describe, it, expect } from "vitest";
import { getProviderAdapter } from "@/lib/cricket/streaming/providers/index";
import { overlayOnlyProvider } from "@/lib/cricket/streaming/providers/overlay-only";
import { createExternalEmbedProvider } from "@/lib/cricket/streaming/providers/external-embed";

describe("overlay_only provider", () => {
  it("is always configured", () => {
    expect(overlayOnlyProvider.isConfigured()).toBe(true);
  });

  it("returns success for createStream", async () => {
    const result = await overlayOnlyProvider.createStream({ title: "Test" });
    expect(result.success).toBe(true);
    expect(result.data?.providerStreamId).toBe("overlay_only");
  });

  it("returns healthy status", async () => {
    const result = await overlayOnlyProvider.getHealth("any");
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("healthy");
  });
});

describe("external_embed provider", () => {
  it("is not configured when no URL given", () => {
    const provider = createExternalEmbedProvider(null, null);
    expect(provider.isConfigured()).toBe(false);
  });

  it("is configured when embed URL given", () => {
    const provider = createExternalEmbedProvider("https://example.com/embed/123", null);
    expect(provider.isConfigured()).toBe(true);
  });

  it("is configured when watch URL given", () => {
    const provider = createExternalEmbedProvider(null, "https://example.com/watch");
    expect(provider.isConfigured()).toBe(true);
  });

  it("returns error on createStream when no URL", async () => {
    const provider = createExternalEmbedProvider(null, null);
    const result = await provider.createStream({ title: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns unknown health status", async () => {
    const provider = createExternalEmbedProvider("https://example.com/embed", null);
    const result = await provider.getHealth("any");
    expect(result.data?.status).toBe("unknown");
  });
});

describe("getProviderAdapter", () => {
  it("returns overlay_only for overlay_only key", () => {
    const adapter = getProviderAdapter("overlay_only");
    expect(adapter.providerKey).toBe("overlay_only");
    expect(adapter.isConfigured()).toBe(true);
  });

  it("returns external_embed adapter", () => {
    const adapter = getProviderAdapter("external_embed", { embedUrl: "https://example.com/embed" });
    expect(adapter.providerKey).toBe("external_embed");
    expect(adapter.isConfigured()).toBe(true);
  });

  it("returns disabled adapter for youtube (not configured)", () => {
    const adapter = getProviderAdapter("youtube");
    expect(adapter.isConfigured()).toBe(false);
  });

  it("returns disabled adapter for twitch (not configured)", () => {
    const adapter = getProviderAdapter("twitch");
    expect(adapter.isConfigured()).toBe(false);
  });

  it("returns disabled adapter for unknown provider", () => {
    const adapter = getProviderAdapter("tiktok_live");
    expect(adapter.isConfigured()).toBe(false);
  });

  it("disabled provider createStream returns error", async () => {
    const adapter = getProviderAdapter("youtube");
    const result = await adapter.createStream({ title: "Test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not configured");
  });
});
