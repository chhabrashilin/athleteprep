import { describe, it, expect, afterEach } from "vitest";
import { getFeatureFlag } from "@/lib/config/feature-flags";

// We test getFeatureFlag (the pure parser) because the flags object is
// evaluated at module load time — manipulating process.env after import
// only works when re-importing, which vitest handles via vi.resetModules().

describe("getFeatureFlag", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore env after each test
    Object.assign(process.env, originalEnv);
    Object.keys(process.env).forEach((k) => {
      if (!(k in originalEnv)) delete process.env[k];
    });
  });

  it('returns true when env var is "true"', () => {
    process.env.TEST_FLAG = "true";
    expect(getFeatureFlag("TEST_FLAG")).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.TEST_FLAG = "false";
    expect(getFeatureFlag("TEST_FLAG")).toBe(false);
  });

  it("returns false when env var is missing (default fallback)", () => {
    delete process.env.TEST_FLAG;
    expect(getFeatureFlag("TEST_FLAG")).toBe(false);
  });

  it("returns true when env var is missing and fallback is true", () => {
    delete process.env.TEST_FLAG;
    expect(getFeatureFlag("TEST_FLAG", true)).toBe(true);
  });

  it('returns false for any value other than "true"', () => {
    for (const val of ["1", "yes", "TRUE", "True", "", "0"]) {
      process.env.TEST_FLAG = val;
      expect(getFeatureFlag("TEST_FLAG"), `value="${val}"`).toBe(false);
    }
  });

  it('returns true only for the exact string "true"', () => {
    process.env.TEST_FLAG = "true";
    expect(getFeatureFlag("TEST_FLAG")).toBe(true);
  });
});
