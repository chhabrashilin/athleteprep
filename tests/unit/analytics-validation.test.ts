import { describe, it, expect } from "vitest";
import { analyticsFilterSchema, generateSnapshotSchema } from "@/lib/cricket/validation/analytics";

const VALID_MATCH_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

describe("analyticsFilterSchema", () => {
  it("accepts valid chart type", () => {
    const result = analyticsFilterSchema.safeParse({ chartType: "worm" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid chart types", () => {
    const types = ["worm", "manhattan", "run_rate", "wagon_wheel", "partnerships", "momentum", "phase_summary"] as const;
    for (const t of types) {
      expect(analyticsFilterSchema.safeParse({ chartType: t }).success, `Expected ${t} to be valid`).toBe(true);
    }
  });

  it("rejects invalid chart type", () => {
    expect(analyticsFilterSchema.safeParse({ chartType: "invalid" }).success).toBe(false);
  });

  it("accepts optional matchId UUID", () => {
    const result = analyticsFilterSchema.safeParse({ chartType: "worm", matchId: VALID_MATCH_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid matchId UUID", () => {
    const result = analyticsFilterSchema.safeParse({ chartType: "worm", matchId: "bad-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects endOver < startOver", () => {
    const result = analyticsFilterSchema.safeParse({
      chartType: "worm",
      startOver: 10,
      endOver: 5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts endOver == startOver", () => {
    const result = analyticsFilterSchema.safeParse({
      chartType: "worm",
      startOver: 5,
      endOver: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects startOver < 0", () => {
    const result = analyticsFilterSchema.safeParse({
      chartType: "worm",
      startOver: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid phase filter", () => {
    const result = analyticsFilterSchema.safeParse({
      chartType: "phase_summary",
      phase: "powerplay",
    });
    expect(result.success).toBe(true);
  });
});

describe("generateSnapshotSchema", () => {
  it("accepts valid snapshot input", () => {
    const result = generateSnapshotSchema.safeParse({
      matchId: VALID_MATCH_UUID,
      snapshotType: "worm_chart",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full_match_analytics snapshot type", () => {
    const result = generateSnapshotSchema.safeParse({
      matchId: VALID_MATCH_UUID,
      snapshotType: "full_match_analytics",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid snapshot type", () => {
    const result = generateSnapshotSchema.safeParse({
      matchId: VALID_MATCH_UUID,
      snapshotType: "unknown_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid matchId", () => {
    const result = generateSnapshotSchema.safeParse({
      matchId: "bad-id",
      snapshotType: "worm_chart",
    });
    expect(result.success).toBe(false);
  });
});
