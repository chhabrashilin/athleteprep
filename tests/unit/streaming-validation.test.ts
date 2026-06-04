/**
 * tests/unit/streaming-validation.test.ts
 * Tests for streaming validation schemas.
 */

import { describe, it, expect } from "vitest";
import { streamChannelSchema, matchStreamSchema, checklistUpdateSchema } from "@/lib/cricket/validation/streaming";

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("streamChannelSchema", () => {
  it("accepts a valid overlay_only channel", () => {
    const result = streamChannelSchema.safeParse({
      league_id: VALID_UUID,
      name: "Main Channel",
      slug: "main-channel",
      provider: "overlay_only",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = streamChannelSchema.safeParse({
      league_id: VALID_UUID,
      name: "Test",
      slug: "test",
      provider: "facebook_live",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = streamChannelSchema.safeParse({
      league_id: VALID_UUID,
      name: "Test",
      slug: "test",
      provider: "overlay_only",
      public_watch_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const result = streamChannelSchema.safeParse({
      league_id: VALID_UUID,
      name: "Test",
      slug: "Main-Channel",
      provider: "overlay_only",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name too short", () => {
    const result = streamChannelSchema.safeParse({
      league_id: VALID_UUID,
      name: "A",
      slug: "a",
      provider: "overlay_only",
    });
    expect(result.success).toBe(false);
  });
});

describe("matchStreamSchema", () => {
  it("accepts a valid overlay_only stream", () => {
    const result = matchStreamSchema.safeParse({
      match_id:           VALID_UUID,
      title:              "Live Match",
      provider:           "overlay_only",
      visibility:         "league",
      allow_public_embed: false,
    });
    expect(result.success).toBe(true);
  });

  it("requires embed_url for external_embed provider", () => {
    const result = matchStreamSchema.safeParse({
      match_id:           VALID_UUID,
      title:              "External",
      provider:           "external_embed",
      visibility:         "public",
      allow_public_embed: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts external_embed with embed_url", () => {
    const result = matchStreamSchema.safeParse({
      match_id:           VALID_UUID,
      title:              "External",
      provider:           "external_embed",
      visibility:         "public",
      allow_public_embed: true,
      embed_url:          "https://www.youtube.com/embed/abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid visibility", () => {
    const result = matchStreamSchema.safeParse({
      match_id:           VALID_UUID,
      title:              "Test",
      provider:           "overlay_only",
      visibility:         "friends_only",
      allow_public_embed: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("checklistUpdateSchema", () => {
  it("accepts a valid update", () => {
    const result = checklistUpdateSchema.safeParse({
      checklist_key: "match_setup_complete",
      completed: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing key", () => {
    const result = checklistUpdateSchema.safeParse({ completed: true });
    expect(result.success).toBe(false);
  });
});
