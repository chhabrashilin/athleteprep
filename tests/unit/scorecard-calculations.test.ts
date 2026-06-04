import { describe, it, expect } from "vitest";
import {
  ballsToOversText,
  oversTextToBalls,
  calculateStrikeRate,
  calculateEconomyRate,
  calculateRunRate,
  calculateRequiredRunRate,
  calculateExtrasTotal,
  calculateInningsTotal,
  validateScorecardConsistency,
  determineMatchResult,
} from "@/lib/cricket/scorecards/calculations";

describe("ballsToOversText", () => {
  it("converts 0 balls to 0.0", () => {
    expect(ballsToOversText(0)).toBe("0.0");
  });

  it("converts 1 ball to 0.1", () => {
    expect(ballsToOversText(1)).toBe("0.1");
  });

  it("converts 5 balls to 0.5", () => {
    expect(ballsToOversText(5)).toBe("0.5");
  });

  it("converts 6 balls to 1.0", () => {
    expect(ballsToOversText(6)).toBe("1.0");
  });

  it("converts 17 balls to 2.5", () => {
    expect(ballsToOversText(17)).toBe("2.5");
  });

  it("converts 120 balls to 20.0", () => {
    expect(ballsToOversText(120)).toBe("20.0");
  });

  it("handles negative balls as 0.0", () => {
    expect(ballsToOversText(-1)).toBe("0.0");
  });
});

describe("oversTextToBalls", () => {
  it("converts 0.0 to 0", () => {
    expect(oversTextToBalls("0.0")).toBe(0);
  });

  it("converts 0.1 to 1", () => {
    expect(oversTextToBalls("0.1")).toBe(1);
  });

  it("converts 1.0 to 6", () => {
    expect(oversTextToBalls("1.0")).toBe(6);
  });

  it("converts 2.5 to 17", () => {
    expect(oversTextToBalls("2.5")).toBe(17);
  });

  it("converts 20.0 to 120", () => {
    expect(oversTextToBalls("20.0")).toBe(120);
  });

  it("throws for invalid balls digit (6)", () => {
    expect(() => oversTextToBalls("1.6")).toThrow();
  });

  it("throws for negative value", () => {
    expect(() => oversTextToBalls("-1.0")).toThrow();
  });

  it("throws for non-numeric text", () => {
    expect(() => oversTextToBalls("abc")).toThrow();
  });
});

describe("calculateStrikeRate", () => {
  it("returns null for 0 balls", () => {
    expect(calculateStrikeRate(50, 0)).toBeNull();
  });

  it("calculates correctly", () => {
    expect(calculateStrikeRate(50, 40)).toBe(125);
  });

  it("returns 0 for 0 runs", () => {
    expect(calculateStrikeRate(0, 10)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const sr = calculateStrikeRate(1, 3);
    expect(sr).not.toBeNull();
    expect(sr!.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});

describe("calculateEconomyRate", () => {
  it("returns null for 0 balls", () => {
    expect(calculateEconomyRate(30, 0)).toBeNull();
  });

  it("calculates correctly (30 runs in 12 balls = 2.0 overs = 15.0 econ)", () => {
    expect(calculateEconomyRate(30, 12)).toBe(15);
  });

  it("calculates correctly (24 runs in 24 balls = 4 overs = 6.0 econ)", () => {
    expect(calculateEconomyRate(24, 24)).toBe(6);
  });
});

describe("calculateRunRate", () => {
  it("returns null for 0 balls", () => {
    expect(calculateRunRate(100, 0)).toBeNull();
  });

  it("calculates RR for 142 runs in 120 balls", () => {
    const rr = calculateRunRate(142, 120);
    expect(rr).toBe(7.1);
  });
});

describe("calculateRequiredRunRate", () => {
  it("returns null for 0 balls remaining", () => {
    expect(calculateRequiredRunRate(150, 100, 0)).toBeNull();
  });

  it("returns 0 when target is already met", () => {
    expect(calculateRequiredRunRate(100, 105, 30)).toBe(0);
  });

  it("calculates RRR correctly", () => {
    const rrr = calculateRequiredRunRate(142, 100, 36);
    expect(rrr).not.toBeNull();
    expect(rrr).toBeGreaterThan(0);
  });
});

describe("calculateExtrasTotal", () => {
  it("sums all extras", () => {
    expect(calculateExtrasTotal({ byes: 2, legByes: 3, wides: 5, noBalls: 1, penaltyRuns: 0 })).toBe(11);
  });

  it("handles missing fields as 0", () => {
    expect(calculateExtrasTotal({ wides: 4 })).toBe(4);
  });

  it("returns 0 for no extras", () => {
    expect(calculateExtrasTotal({})).toBe(0);
  });
});

describe("calculateInningsTotal", () => {
  it("adds batting runs to extras", () => {
    const result = calculateInningsTotal({
      battingRuns: 130,
      byes: 2,
      legByes: 3,
      wides: 5,
      noBalls: 2,
      penaltyRuns: 0,
    });
    expect(result.total).toBe(142);
    expect(result.extras).toBe(12);
  });
});

describe("validateScorecardConsistency", () => {
  it("returns no warnings for consistent scorecard", () => {
    const warnings = validateScorecardConsistency({
      inningsTotalRuns: 142,
      extrasTotal: 12,
      battingRunsSum: 130,
      wicketsLost: 7,
      ballsBowled: 120,
      bowlingBallsSum: 120,
      bowlingWicketsSum: 7,
    });
    expect(warnings).toHaveLength(0);
  });

  it("detects total mismatch", () => {
    const warnings = validateScorecardConsistency({
      inningsTotalRuns: 150,
      extrasTotal: 12,
      battingRunsSum: 130,
      wicketsLost: 7,
      ballsBowled: 120,
      bowlingBallsSum: 120,
      bowlingWicketsSum: 7,
    });
    expect(warnings.some((w) => w.type === "total_mismatch")).toBe(true);
  });

  it("detects bowling wickets exceeding innings wickets", () => {
    const warnings = validateScorecardConsistency({
      inningsTotalRuns: 142,
      extrasTotal: 12,
      battingRunsSum: 130,
      wicketsLost: 5,
      ballsBowled: 120,
      bowlingBallsSum: 120,
      bowlingWicketsSum: 8,
    });
    expect(warnings.some((w) => w.type === "bowling_wickets_exceed_wickets_lost")).toBe(true);
  });

  it("detects wickets exceeding 10", () => {
    const warnings = validateScorecardConsistency({
      inningsTotalRuns: 0,
      extrasTotal: 0,
      battingRunsSum: 0,
      wicketsLost: 11,
      ballsBowled: 60,
      bowlingBallsSum: 60,
      bowlingWicketsSum: 10,
    });
    expect(warnings.some((w) => w.type === "wickets_exceed_ten")).toBe(true);
  });
});

describe("determineMatchResult", () => {
  const homeId = "home-team";
  const awayId = "away-team";

  const completedInnings = (n: number, battingTeam: string, runs: number, wickets: number) => ({
    battingTeamId: battingTeam,
    totalRuns: runs,
    wicketsLost: wickets,
    ballsBowled: 120,
    allOut: wickets === 10,
    declared: false,
    forfeited: false,
    inningsStatus: "completed" as const,
  });

  it("returns unknown if fewer than 2 completed innings", () => {
    const result = determineMatchResult({
      homeTeamId: homeId,
      awayTeamId: awayId,
      innings: [completedInnings(1, homeId, 142, 7)],
      scheduledOvers: 20,
    });
    expect(result.resultType).toBe("unknown");
  });

  it("detects home win by runs", () => {
    const result = determineMatchResult({
      homeTeamId: homeId,
      awayTeamId: awayId,
      innings: [
        completedInnings(1, homeId, 142, 7),
        completedInnings(2, awayId, 138, 8),
      ],
      scheduledOvers: 20,
    });
    expect(result.resultType).toBe("home_win");
    expect(result.marginRuns).toBe(4);
    expect(result.winnerTeamId).toBe(homeId);
  });

  it("detects away win by wickets", () => {
    const result = determineMatchResult({
      homeTeamId: homeId,
      awayTeamId: awayId,
      innings: [
        completedInnings(1, homeId, 138, 8),
        completedInnings(2, awayId, 142, 7),
      ],
      scheduledOvers: 20,
    });
    expect(result.resultType).toBe("away_win");
    expect(result.marginWickets).toBe(3);
    expect(result.winnerTeamId).toBe(awayId);
  });

  it("detects tie", () => {
    const result = determineMatchResult({
      homeTeamId: homeId,
      awayTeamId: awayId,
      innings: [
        completedInnings(1, homeId, 142, 7),
        completedInnings(2, awayId, 142, 8),
      ],
      scheduledOvers: 20,
    });
    expect(result.resultType).toBe("tie");
    expect(result.winnerTeamId).toBeNull();
  });

  it("returns abandoned for abandoned match", () => {
    const result = determineMatchResult({
      homeTeamId: homeId,
      awayTeamId: awayId,
      innings: [],
      scheduledOvers: 20,
      abandoned: true,
    });
    expect(result.resultType).toBe("abandoned");
  });
});
