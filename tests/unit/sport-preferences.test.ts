import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  resolvePreferredSport,
  isValidSportSlug,
  getLocalSelectedSport,
  setLocalSelectedSport,
  SELECTED_SPORT_KEY,
} from "@/lib/sports/preferences";

// ─── resolvePreferredSport ────────────────────────────────────────────────────

describe("resolvePreferredSport", () => {
  it("returns remoteSport when it is a valid slug", () => {
    expect(resolvePreferredSport({ remoteSport: "cricket", localSport: "general" })).toBe("cricket");
  });

  it("returns localSport when remoteSport is null", () => {
    expect(resolvePreferredSport({ remoteSport: null, localSport: "cricket" })).toBe("cricket");
  });

  it("returns localSport when remoteSport is undefined", () => {
    expect(resolvePreferredSport({ localSport: "general" })).toBe("general");
  });

  it("returns fallback when both remote and local are null", () => {
    expect(resolvePreferredSport({ remoteSport: null, localSport: null, fallback: "cricket" })).toBe("cricket");
  });

  it("returns 'general' when remote, local, and fallback are all null/undefined", () => {
    expect(resolvePreferredSport({ remoteSport: null, localSport: null })).toBe("general");
  });

  it("ignores invalid remoteSport and falls through to local", () => {
    expect(resolvePreferredSport({ remoteSport: "polo", localSport: "cricket" })).toBe("cricket");
  });

  it("ignores invalid localSport and falls through to fallback", () => {
    expect(resolvePreferredSport({ remoteSport: null, localSport: "polo", fallback: "general" })).toBe("general");
  });

  it("returns 'general' when all inputs are invalid", () => {
    expect(resolvePreferredSport({ remoteSport: "polo", localSport: "lacrosse" })).toBe("general");
  });

  it("remote takes priority even when local is valid", () => {
    expect(resolvePreferredSport({ remoteSport: "general", localSport: "cricket" })).toBe("general");
  });

  it("handles empty-string remote by falling through to local", () => {
    expect(resolvePreferredSport({ remoteSport: "", localSport: "cricket" })).toBe("cricket");
  });
});

// ─── isValidSportSlug ─────────────────────────────────────────────────────────

describe("isValidSportSlug", () => {
  it("returns true for all known slugs", () => {
    const known = ["general", "cricket", "baseball", "basketball", "soccer", "football"];
    for (const slug of known) {
      expect(isValidSportSlug(slug), slug).toBe(true);
    }
  });

  it("returns false for an unknown slug", () => {
    expect(isValidSportSlug("polo")).toBe(false);
    expect(isValidSportSlug("lacrosse")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidSportSlug(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidSportSlug(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidSportSlug("")).toBe(false);
  });
});

// ─── localStorage helpers ─────────────────────────────────────────────────────
// jsdom provides window / localStorage in the test environment.

describe("getLocalSelectedSport", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when localStorage has no entry", () => {
    expect(getLocalSelectedSport()).toBeNull();
  });

  it("returns the stored slug when valid", () => {
    localStorage.setItem(SELECTED_SPORT_KEY, "cricket");
    expect(getLocalSelectedSport()).toBe("cricket");
  });

  it("returns null for an invalid stored value", () => {
    localStorage.setItem(SELECTED_SPORT_KEY, "polo");
    expect(getLocalSelectedSport()).toBeNull();
  });
});

describe("setLocalSelectedSport", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("writes the slug to localStorage", () => {
    setLocalSelectedSport("cricket");
    expect(localStorage.getItem(SELECTED_SPORT_KEY)).toBe("cricket");
  });

  it("overwrites a previous value", () => {
    setLocalSelectedSport("cricket");
    setLocalSelectedSport("general");
    expect(localStorage.getItem(SELECTED_SPORT_KEY)).toBe("general");
  });
});
