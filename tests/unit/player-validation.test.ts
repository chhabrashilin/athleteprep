/**
 * tests/unit/player-validation.test.ts
 * Unit tests for cricket player validation schemas and helpers.
 */

import { describe, it, expect } from "vitest";
import {
  createPlayerSchema,
  updatePlayerSchema,
  generatePlayerSlug,
  normalizePlayerSlug,
} from "@/lib/cricket/validation/player";

const VALID_PLAYER_INPUT = {
  displayName: "Aarav Singh",
};

// ─── generatePlayerSlug ───────────────────────────────────────────────────────

describe("generatePlayerSlug", () => {
  it("hyphenates display name", () => {
    expect(generatePlayerSlug("Aarav Singh")).toBe("aarav-singh");
  });

  it("lowercases", () => {
    expect(generatePlayerSlug("Rahul MEHTA")).toBe("rahul-mehta");
  });

  it("removes special chars", () => {
    expect(generatePlayerSlug("John O'Brien")).toBe("john-obrien");
  });

  it("collapses spaces", () => {
    expect(generatePlayerSlug("  Two  Spaces  ")).toBe("two-spaces");
  });
});

// ─── normalizePlayerSlug ──────────────────────────────────────────────────────

describe("normalizePlayerSlug", () => {
  it("lowercases and strips invalids", () => {
    expect(normalizePlayerSlug("Aarav_Singh!")).toBe("aaravsingh");
  });

  it("collapses hyphens", () => {
    expect(normalizePlayerSlug("aarav--singh")).toBe("aarav-singh");
  });
});

// ─── createPlayerSchema ───────────────────────────────────────────────────────

describe("createPlayerSchema", () => {
  it("accepts minimum valid player", () => {
    const result = createPlayerSchema.safeParse(VALID_PLAYER_INPUT);
    expect(result.success).toBe(true);
  });

  it("accepts full player input", () => {
    const result = createPlayerSchema.safeParse({
      displayName: "Aarav Singh",
      email: "aarav@example.com",
      phone: "+1 555 000 0000",
      battingStyle: "right_hand_bat",
      bowlingStyle: "right_arm_medium",
      primaryRole: "all_rounder",
      secondaryRole: "batter",
      bio: "An experienced all-rounder.",
      dateOfBirth: "1995-06-15",
      country: "India",
      city: "Delhi",
      jerseyNumber: "7",
      dominantHand: "right",
      fieldingPositionPreference: "slip",
      battingOrderPreference: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects display name shorter than 2 chars", () => {
    const result = createPlayerSchema.safeParse({ displayName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects display name longer than 100 chars", () => {
    const result = createPlayerSchema.safeParse({ displayName: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, email: "not-valid" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string email (optional)", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid jersey number", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, jerseyNumber: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts valid jersey number", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, jerseyNumber: "99" });
    expect(result.success).toBe(true);
  });

  it("rejects batting order below 1", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, battingOrderPreference: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects batting order above 11", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, battingOrderPreference: 12 });
    expect(result.success).toBe(false);
  });

  it("accepts batting order 1–11", () => {
    for (let i = 1; i <= 11; i++) {
      const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, battingOrderPreference: i });
      expect(result.success).toBe(true);
    }
  });

  it("rejects bio longer than 1000 chars", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, bio: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid photo URL", () => {
    const result = createPlayerSchema.safeParse({ ...VALID_PLAYER_INPUT, profilePhotoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

// ─── updatePlayerSchema ───────────────────────────────────────────────────────

describe("updatePlayerSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = updatePlayerSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update", () => {
    const result = updatePlayerSchema.safeParse({ bio: "Updated bio." });
    expect(result.success).toBe(true);
  });

  it("still validates email if provided", () => {
    const result = updatePlayerSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});
