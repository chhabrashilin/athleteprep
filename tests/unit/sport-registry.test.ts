import { describe, it, expect } from "vitest";
import {
  getAllSports,
  getEnabledSports,
  getSportBySlug,
  isSportEnabled,
} from "@/lib/sports/registry";

describe("getAllSports", () => {
  it("returns a non-empty array", () => {
    expect(getAllSports().length).toBeGreaterThan(0);
  });

  it("includes general and cricket entries", () => {
    const slugs = getAllSports().map((s) => s.slug);
    expect(slugs).toContain("general");
    expect(slugs).toContain("cricket");
  });
});

describe("getEnabledSports", () => {
  it("returns only sports with status 'enabled'", () => {
    const enabled = getEnabledSports();
    expect(enabled.every((s) => s.status === "enabled")).toBe(true);
  });

  it("always includes general sports (always enabled)", () => {
    const slugs = getEnabledSports().map((s) => s.slug);
    expect(slugs).toContain("general");
  });

  it("does not include coming_soon sports", () => {
    const enabled = getEnabledSports();
    expect(enabled.every((s) => s.status !== "coming_soon")).toBe(true);
  });
});

describe("getSportBySlug", () => {
  it("returns the matching sport for a known slug", () => {
    const sport = getSportBySlug("general");
    expect(sport).toBeDefined();
    expect(sport?.slug).toBe("general");
    expect(sport?.displayName).toBe("General Sports");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getSportBySlug("polo")).toBeUndefined();
  });

  it("returns cricket entry with expected shape", () => {
    const sport = getSportBySlug("cricket");
    expect(sport).toBeDefined();
    expect(sport?.slug).toBe("cricket");
    expect(sport?.supportedFeatureGroups).toContain("leagues");
    expect(sport?.supportedFeatureGroups).toContain("live-scoring");
  });
});

describe("isSportEnabled", () => {
  it("returns true for general (always enabled)", () => {
    expect(isSportEnabled("general")).toBe(true);
  });

  it("returns false for an unknown slug", () => {
    expect(isSportEnabled("nonexistent-sport")).toBe(false);
  });

  it("returns false for coming_soon sports", () => {
    const comingSoon = getAllSports().filter((s) => s.status === "coming_soon");
    for (const sport of comingSoon) {
      expect(isSportEnabled(sport.slug), sport.slug).toBe(false);
    }
  });
});
