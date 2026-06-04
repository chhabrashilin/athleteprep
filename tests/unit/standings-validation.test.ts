import { describe, it, expect } from "vitest";
import { standingsRebuildSchema, leaderboardFilterSchema } from "@/lib/cricket/validation/standings";

// Proper RFC 4122 v4 UUIDs (version=4, variant=8/9/a/b)
const LEAGUE_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const TEAM_UUID   = "f47ac10b-58cc-4372-a567-0e02b2c3d480";

describe("standingsRebuildSchema", () => {
  it("accepts valid input", () => {
    const result = standingsRebuildSchema.safeParse({ leagueId: LEAGUE_UUID });
    expect(result.success).toBe(true);
  });

  it("applies defaults", () => {
    const result = standingsRebuildSchema.safeParse({ leagueId: LEAGUE_UUID });
    if (!result.success) throw new Error("Should succeed");
    expect(result.data.snapshot).toBe(true);
    expect(result.data.nrrUseFullQuotaWhenAllOut).toBe(true);
    expect(result.data.includeUnpublishedMatches).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = standingsRebuildSchema.safeParse({ leagueId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing leagueId", () => {
    const result = standingsRebuildSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("leaderboardFilterSchema", () => {
  it("accepts valid batting_runs filter", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid leaderboard types", () => {
    const types = [
      "batting_runs", "batting_average", "batting_strike_rate", "highest_score",
      "bowling_wickets", "bowling_average", "economy_rate", "bowling_strike_rate",
      "fielding_catches", "all_rounder_index", "team_nrr", "team_points",
    ] as const;
    for (const t of types) {
      const result = leaderboardFilterSchema.safeParse({
        leagueId: LEAGUE_UUID,
        leaderboardType: t,
      });
      expect(result.success, `Expected ${t} to be valid`).toBe(true);
    }
  });

  it("rejects invalid leaderboard_type", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "invalid_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejects limit > 200", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
      limit: 201,
    });
    expect(result.success).toBe(false);
  });

  it("rejects limit < 1", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative minMatches", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
      minMatches: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional teamId", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
      teamId: TEAM_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid teamId UUID", () => {
    const result = leaderboardFilterSchema.safeParse({
      leagueId: LEAGUE_UUID,
      leaderboardType: "batting_runs",
      teamId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
