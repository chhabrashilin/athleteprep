/**
 * tests/unit/overlay-validation.test.ts
 * Tests for overlay theme and token validation schemas.
 */

import { describe, it, expect } from "vitest";
import { overlayThemeSchema, overlayTokenCreateSchema } from "@/lib/cricket/validation/overlays";

const UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("overlayThemeSchema", () => {
  it("accepts a valid minimal theme", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Classic Theme",
      slug: "classic-theme",
      layout: "classic_scorebug",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid hex colors", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "lower_third",
      primary_color: "#0ea5e9",
      secondary_color: "#abc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "lower_third",
      primary_color: "blue",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid layout", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "sports_ticker",
    });
    expect(result.success).toBe(false);
  });

  it("rejects sponsor text too long", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "classic_scorebug",
      sponsor_text: "x".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("rejects safe area out of range", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "classic_scorebug",
      safe_area_top: 300,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid logo URL", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "classic_scorebug",
      logo_url: "https://example.com/logo.png",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid logo URL", () => {
    const result = overlayThemeSchema.safeParse({
      league_id: UUID,
      name: "Themed",
      slug: "themed",
      layout: "classic_scorebug",
      logo_url: "ftp://not-http.com/logo.png",
    });
    expect(result.success).toBe(false);
  });
});

describe("overlayTokenCreateSchema", () => {
  it("accepts valid token input", () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    const result = overlayTokenCreateSchema.safeParse({
      match_id:   UUID,
      scope:      "match_overlay",
      label:      "OBS Studio",
      expires_at: future,
    });
    expect(result.success).toBe(true);
  });

  it("accepts without expiry", () => {
    const result = overlayTokenCreateSchema.safeParse({
      match_id: UUID,
      scope:    "scorebug",
    });
    expect(result.success).toBe(true);
  });

  it("rejects past expiry", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = overlayTokenCreateSchema.safeParse({
      match_id:   UUID,
      scope:      "match_overlay",
      expires_at: past,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scope", () => {
    const result = overlayTokenCreateSchema.safeParse({
      match_id: UUID,
      scope:    "admin_access",
    });
    expect(result.success).toBe(false);
  });
});
