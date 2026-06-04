import { describe, it, expect } from "vitest";
import {
  calculateBattingAverage,
  calculateBattingStrikeRate,
  calculateBowlingAverage,
  calculateEconomyRate,
  calculateBowlingStrikeRate,
  calculateBestBowling,
  calculateHighestScore,
  aggregatePlayerStatsFromScorecards,
  rankPlayers,
  calculateAllRounderIndex,
} from "@/lib/cricket/stats/player-calculations";
import type { PlayerScorecardData, PlayerStatsForRanking } from "@/lib/cricket/stats/player-calculations";

// ─── Batting average ────────────────────────────────────────────────────────

describe("calculateBattingAverage", () => {
  it("returns null for 0 outs", () => {
    expect(calculateBattingAverage(50, 0)).toBeNull();
  });

  it("calculates correctly", () => {
    expect(calculateBattingAverage(100, 4)).toBe(25);
  });

  it("rounds to 2 decimal places", () => {
    const avg = calculateBattingAverage(1, 3);
    expect(avg).not.toBeNull();
    expect(avg!.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

// ─── Batting strike rate ─────────────────────────────────────────────────────

describe("calculateBattingStrikeRate", () => {
  it("returns null for 0 balls", () => {
    expect(calculateBattingStrikeRate(50, 0)).toBeNull();
  });

  it("calculates correctly: 50 runs off 40 balls = 125.00", () => {
    expect(calculateBattingStrikeRate(50, 40)).toBe(125);
  });

  it("returns 0 for 0 runs", () => {
    expect(calculateBattingStrikeRate(0, 20)).toBe(0);
  });
});

// ─── Bowling average ─────────────────────────────────────────────────────────

describe("calculateBowlingAverage", () => {
  it("returns null for 0 wickets", () => {
    expect(calculateBowlingAverage(50, 0)).toBeNull();
  });

  it("calculates correctly: 60 runs / 4 wickets = 15.00", () => {
    expect(calculateBowlingAverage(60, 4)).toBe(15);
  });
});

// ─── Economy rate ────────────────────────────────────────────────────────────

describe("calculateEconomyRate", () => {
  it("returns null for 0 balls", () => {
    expect(calculateEconomyRate(30, 0)).toBeNull();
  });

  it("calculates correctly: 30 runs in 12 balls = 15.00 econ", () => {
    expect(calculateEconomyRate(30, 12)).toBe(15);
  });

  it("calculates correctly: 24 runs in 24 balls = 6.00 econ", () => {
    expect(calculateEconomyRate(24, 24)).toBe(6);
  });
});

// ─── Bowling strike rate ─────────────────────────────────────────────────────

describe("calculateBowlingStrikeRate", () => {
  it("returns null for 0 wickets", () => {
    expect(calculateBowlingStrikeRate(24, 0)).toBeNull();
  });

  it("calculates correctly: 24 balls / 4 wickets = 6.00", () => {
    expect(calculateBowlingStrikeRate(24, 4)).toBe(6);
  });
});

// ─── Best bowling ─────────────────────────────────────────────────────────────

describe("calculateBestBowling", () => {
  it("returns null for empty entries", () => {
    expect(calculateBestBowling([])).toBeNull();
  });

  it("returns best by most wickets", () => {
    const entries = [
      { wickets: 2, runsConceded: 30 },
      { wickets: 4, runsConceded: 20 },
      { wickets: 3, runsConceded: 25 },
    ];
    const best = calculateBestBowling(entries);
    expect(best?.wickets).toBe(4);
    expect(best?.runs).toBe(20);
  });

  it("breaks ties by fewer runs", () => {
    const entries = [
      { wickets: 3, runsConceded: 35 },
      { wickets: 3, runsConceded: 20 },
    ];
    const best = calculateBestBowling(entries);
    expect(best?.runs).toBe(20);
  });
});

// ─── Highest score ─────────────────────────────────────────────────────────

describe("calculateHighestScore", () => {
  it("returns null for empty entries", () => {
    expect(calculateHighestScore([])).toBeNull();
  });

  it("returns null for all did-not-bat", () => {
    expect(calculateHighestScore([{ runs: 0, isOut: false, didNotBat: true }])).toBeNull();
  });

  it("returns highest score", () => {
    const entries = [
      { runs: 25, isOut: true },
      { runs: 72, isOut: false },
      { runs: 14, isOut: true },
    ];
    const result = calculateHighestScore(entries);
    expect(result?.runs).toBe(72);
    expect(result?.notOut).toBe(true);
  });
});

// ─── Aggregate player stats ───────────────────────────────────────────────────

describe("aggregatePlayerStatsFromScorecards", () => {
  it("returns zero stats for empty input", () => {
    const stats = aggregatePlayerStatsFromScorecards([]);
    expect(stats.matchesPlayed).toBe(0);
    expect(stats.runs).toBe(0);
    expect(stats.wickets).toBe(0);
  });

  it("correctly aggregates runs across matches", () => {
    const scorecards: PlayerScorecardData[] = [
      {
        matchId: "m1",
        batting: { runs: 45, balls: 30, fours: 4, sixes: 1, isOut: true, didNotBat: false },
        bowling: null,
      },
      {
        matchId: "m2",
        batting: { runs: 72, balls: 60, fours: 7, sixes: 2, isOut: false, didNotBat: false },
        bowling: null,
      },
    ];
    const stats = aggregatePlayerStatsFromScorecards(scorecards);
    expect(stats.matchesPlayed).toBe(2);
    expect(stats.runs).toBe(117);
    expect(stats.inningsBatted).toBe(2);
    expect(stats.notOuts).toBe(1);
    expect(stats.fours).toBe(11);
    expect(stats.sixes).toBe(3);
    expect(stats.highestScore).toBe(72);
  });

  it("correctly aggregates bowling stats", () => {
    const scorecards: PlayerScorecardData[] = [
      {
        matchId: "m1",
        batting: null,
        bowling: { ballsBowled: 24, runsConceded: 30, wickets: 3, maidens: 1, wides: 2, noBalls: 0 },
      },
      {
        matchId: "m2",
        batting: null,
        bowling: { ballsBowled: 18, runsConceded: 25, wickets: 2, maidens: 0, wides: 1, noBalls: 1 },
      },
    ];
    const stats = aggregatePlayerStatsFromScorecards(scorecards);
    expect(stats.ballsBowled).toBe(42);
    expect(stats.wickets).toBe(5);
    expect(stats.maidens).toBe(1);
    expect(stats.bestBowlingWickets).toBe(3);
    expect(stats.bestBowlingRuns).toBe(30);
  });

  it("counts ducks correctly", () => {
    const scorecards: PlayerScorecardData[] = [
      {
        matchId: "m1",
        batting: { runs: 0, balls: 3, fours: 0, sixes: 0, isOut: true, didNotBat: false },
        bowling: null,
      },
      {
        matchId: "m2",
        batting: { runs: 5, balls: 8, fours: 0, sixes: 0, isOut: true, didNotBat: false },
        bowling: null,
      },
    ];
    const stats = aggregatePlayerStatsFromScorecards(scorecards);
    expect(stats.ducks).toBe(1);
  });

  it("counts fifties and hundreds", () => {
    const scorecards: PlayerScorecardData[] = [
      { matchId: "m1", batting: { runs: 55, balls: 40, fours: 5, sixes: 1, isOut: true, didNotBat: false }, bowling: null },
      { matchId: "m2", batting: { runs: 105, balls: 90, fours: 10, sixes: 3, isOut: false, didNotBat: false }, bowling: null },
    ];
    const stats = aggregatePlayerStatsFromScorecards(scorecards);
    expect(stats.fifties).toBe(1);
    expect(stats.hundreds).toBe(1);
  });
});

// ─── rankPlayers ─────────────────────────────────────────────────────────────

describe("rankPlayers", () => {
  function makePlayer(overrides: Partial<PlayerStatsForRanking>): PlayerStatsForRanking {
    return {
      playerId: "p1",
      playerName: "Test Player",
      teamId: "t1",
      teamName: "Test Team",
      matchesPlayed: 5,
      inningsBatted: 5,
      ballsFaced: 120,
      inningsBowled: 4,
      ballsBowled: 96,
      runs: 150,
      highestScore: 55,
      battingAverage: 30,
      battingStrikeRate: 125,
      wickets: 8,
      bowlingAverage: 15,
      economyRate: 5.0,
      bowlingStrikeRate: 12,
      catches: 3,
      stumpings: 0,
      runOuts: 1,
      ...overrides,
    };
  }

  it("sorts by runs for batting_runs", () => {
    const players = [
      makePlayer({ playerId: "a", runs: 200 }),
      makePlayer({ playerId: "b", runs: 350 }),
      makePlayer({ playerId: "c", runs: 100 }),
    ];
    const ranked = rankPlayers(players, "batting_runs");
    expect(ranked[0].playerId).toBe("b");
    expect(ranked[2].playerId).toBe("c");
  });

  it("sorts by wickets for bowling_wickets", () => {
    const players = [
      makePlayer({ playerId: "a", wickets: 5 }),
      makePlayer({ playerId: "b", wickets: 12 }),
    ];
    const ranked = rankPlayers(players, "bowling_wickets");
    expect(ranked[0].playerId).toBe("b");
  });

  it("sorts economy ascending for economy_rate", () => {
    const players = [
      makePlayer({ playerId: "a", economyRate: 7.5 }),
      makePlayer({ playerId: "b", economyRate: 5.2 }),
    ];
    const ranked = rankPlayers(players, "economy_rate");
    expect(ranked[0].playerId).toBe("b");
  });

  it("applies minimum innings filter", () => {
    const players = [
      makePlayer({ playerId: "a", inningsBatted: 1 }),
      makePlayer({ playerId: "b", inningsBatted: 5 }),
    ];
    const ranked = rankPlayers(players, "batting_runs", { minInnings: 3 });
    expect(ranked).toHaveLength(1);
    expect(ranked[0].playerId).toBe("b");
  });

  it("applies minimum matches filter", () => {
    const players = [
      makePlayer({ playerId: "a", matchesPlayed: 1 }),
      makePlayer({ playerId: "b", matchesPlayed: 5 }),
    ];
    const ranked = rankPlayers(players, "batting_runs", { minMatches: 3 });
    expect(ranked).toHaveLength(1);
  });
});

// ─── calculateAllRounderIndex ─────────────────────────────────────────────────

describe("calculateAllRounderIndex", () => {
  it("returns a score between 0 and 100", () => {
    const score = calculateAllRounderIndex({
      battingAverage: 30,
      battingStrikeRate: 120,
      bowlingAverage: 20,
      economyRate: 7.0,
      catches: 5,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 0 for all null stats", () => {
    const score = calculateAllRounderIndex({
      battingAverage: null,
      battingStrikeRate: null,
      bowlingAverage: null,
      economyRate: null,
      catches: 0,
    });
    expect(score).toBe(0);
  });

  it("returns higher score for better all-rounder", () => {
    const good = calculateAllRounderIndex({ battingAverage: 45, battingStrikeRate: 130, bowlingAverage: 18, economyRate: 5.5, catches: 3 });
    const poor = calculateAllRounderIndex({ battingAverage: 10, battingStrikeRate: 80, bowlingAverage: 40, economyRate: 10.0, catches: 0 });
    expect(good).toBeGreaterThan(poor);
  });
});
