import { describe, it, expect } from "vitest";
import {
  buildWormChartData,
  buildManhattanChartData,
  buildRunRateGraphData,
  buildPartnershipChartData,
  buildWagonWheelData,
  buildPhaseSummary,
  buildMatchMomentumData,
  summarizeMatchAnalytics,
  calculateDotBallPercentage,
  calculateBoundaryPercentage,
  classifyBattingPhase,
  inferWagonZoneFromAngle,
  type InningsInfo,
  type PartnershipInput,
} from "@/lib/cricket/analytics/chart-data";
import type { CricketBallEventAnalytics } from "@/lib/cricket/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CricketBallEventAnalytics> = {}): CricketBallEventAnalytics {
  return {
    id: "e1",
    matchId: "m1",
    inningsId: "i1",
    battingTeamId: "team-a",
    bowlingTeamId: "team-b",
    overNumber: 0,
    ballInOver: 0,
    legalBallNumber: 1,
    inningsBallNumber: 1,
    strikerId: "p1",
    nonStrikerId: "p2",
    bowlerId: "p3",
    runsBatter: 0,
    runsExtras: 0,
    runsTotal: 0,
    extraType: null,
    wicketType: null,
    playerOutId: null,
    isLegalDelivery: true,
    isWicket: false,
    isBoundaryFour: false,
    isBoundarySix: false,
    isDotBall: true,
    shotType: null,
    lineLengthText: null,
    fieldingPosition: null,
    shotX: null,
    shotY: null,
    wagonZone: null,
    wagonAngleDegrees: null,
    wagonDistanceMeters: null,
    batContactType: null,
    battingPhase: null,
    bowlingPhase: null,
    pressureIndex: null,
    momentumDelta: null,
    expectedRuns: null,
    expectedWicketProbability: null,
    isDeleted: false,
    createdAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

const innings1: InningsInfo = {
  id: "i1",
  battingTeamId: "team-a",
  inningsNumber: 1,
  totalRuns: 0,
  wicketsLost: 0,
  ballsBowled: 120,
};

// ─── buildWormChartData ───────────────────────────────────────────────────────

describe("buildWormChartData", () => {
  it("returns empty for no events", () => {
    expect(buildWormChartData([], [innings1])).toHaveLength(0);
  });

  it("creates cumulative run progression", () => {
    const events = [
      makeEvent({ overNumber: 0, ballInOver: 0, runsBatter: 4, runsTotal: 4, isBoundaryFour: true }),
      makeEvent({ overNumber: 0, ballInOver: 1, runsBatter: 0, runsTotal: 0 }),
      makeEvent({ overNumber: 0, ballInOver: 2, runsBatter: 2, runsTotal: 2 }),
    ];
    const points = buildWormChartData(events, [innings1]);
    // Start + 3 events
    expect(points.length).toBe(4);
    const last = points.at(-1)!;
    expect(last.cumulativeRuns).toBe(6);
  });

  it("tracks wickets in worm data", () => {
    const events = [
      makeEvent({ overNumber: 0, ballInOver: 0, runsBatter: 1, runsTotal: 1 }),
      makeEvent({ overNumber: 0, ballInOver: 1, runsBatter: 0, runsTotal: 0, isWicket: true, wicketType: "bowled" }),
    ];
    const points = buildWormChartData(events, [innings1]);
    const lastPoint = points.at(-1)!;
    expect(lastPoint.wickets).toBe(1);
  });

  it("skips deleted events", () => {
    const events = [
      makeEvent({ overNumber: 0, ballInOver: 0, runsBatter: 6, runsTotal: 6, isDeleted: true }),
      makeEvent({ overNumber: 0, ballInOver: 1, runsBatter: 2, runsTotal: 2 }),
    ];
    const points = buildWormChartData(events, [innings1]);
    const last = points.at(-1)!;
    expect(last.cumulativeRuns).toBe(2); // deleted event excluded
  });
});

// ─── buildManhattanChartData ──────────────────────────────────────────────────

describe("buildManhattanChartData", () => {
  it("returns empty for no events", () => {
    expect(buildManhattanChartData([])).toHaveLength(0);
  });

  it("groups runs by over", () => {
    const events = [
      makeEvent({ overNumber: 0, runsBatter: 4, runsTotal: 4 }),
      makeEvent({ overNumber: 0, runsBatter: 2, runsTotal: 2 }),
      makeEvent({ overNumber: 1, runsBatter: 6, runsTotal: 6 }),
    ];
    const bars = buildManhattanChartData(events);
    expect(bars).toHaveLength(2);
    const over0 = bars.find((b) => b.overNumber === 0)!;
    expect(over0.runs).toBe(6);
    const over1 = bars.find((b) => b.overNumber === 1)!;
    expect(over1.runs).toBe(6);
  });

  it("tracks wickets per over", () => {
    const events = [
      makeEvent({ overNumber: 2, runsBatter: 0, runsTotal: 0, isWicket: true }),
      makeEvent({ overNumber: 2, runsBatter: 1, runsTotal: 1 }),
    ];
    const bars = buildManhattanChartData(events);
    const over2 = bars.find((b) => b.overNumber === 2)!;
    expect(over2.wickets).toBe(1);
  });

  it("counts boundaries per over", () => {
    const events = [
      makeEvent({ overNumber: 0, runsBatter: 4, runsTotal: 4, isBoundaryFour: true }),
      makeEvent({ overNumber: 0, runsBatter: 6, runsTotal: 6, isBoundarySix: true }),
    ];
    const bars = buildManhattanChartData(events);
    expect(bars[0]?.boundaries).toBe(2);
  });
});

// ─── buildRunRateGraphData ────────────────────────────────────────────────────

describe("buildRunRateGraphData", () => {
  it("returns empty for no events", () => {
    expect(buildRunRateGraphData([], [], undefined)).toHaveLength(0);
  });

  it("computes current run rate", () => {
    const events = [
      makeEvent({ overNumber: 0, ballInOver: 0, runsBatter: 6, runsTotal: 6 }),
      makeEvent({ overNumber: 0, ballInOver: 1, runsBatter: 6, runsTotal: 6 }),
    ];
    const points = buildRunRateGraphData(events, [innings1]);
    expect(points.length).toBeGreaterThan(0);
    const last = points.at(-1)!;
    expect(last.currentRunRate).toBeGreaterThan(0);
  });

  it("computes required run rate for chase", () => {
    const chaseInnings: InningsInfo = { ...innings1, id: "i2", inningsNumber: 2 };
    const events = [
      makeEvent({ inningsId: "i2", overNumber: 0, ballInOver: 0, runsBatter: 1, runsTotal: 1 }),
    ];
    const points = buildRunRateGraphData(events, [chaseInnings], 150);
    const last = points.at(-1)!;
    expect(last.requiredRunRate).toBeGreaterThan(0);
  });
});

// ─── buildPartnershipChartData ────────────────────────────────────────────────

describe("buildPartnershipChartData", () => {
  it("returns empty for no partnerships", () => {
    expect(buildPartnershipChartData([])).toHaveLength(0);
  });

  it("builds partnership rows sorted by wicket number", () => {
    const partnerships: PartnershipInput[] = [
      { wicketNumber: 2, runs: 45, balls: 30, startScore: 20, endScore: 65, playerOneName: "A", playerTwoName: "B" },
      { wicketNumber: 1, runs: 20, balls: 15, startScore: 0, endScore: 20, playerOneName: "C", playerTwoName: "D" },
    ];
    const rows = buildPartnershipChartData(partnerships);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.wicketNumber).toBe(1);
    expect(rows[1]?.wicketNumber).toBe(2);
  });

  it("computes run rate for partnerships", () => {
    const partnerships: PartnershipInput[] = [
      { wicketNumber: 1, runs: 36, balls: 36, startScore: 0, endScore: 36, playerOneName: "A", playerTwoName: "B" },
    ];
    const rows = buildPartnershipChartData(partnerships);
    expect(rows[0]?.runRate).toBe(6); // 36 runs / 36 balls * 6
  });
});

// ─── buildWagonWheelData ──────────────────────────────────────────────────────

describe("buildWagonWheelData", () => {
  it("returns empty data for no events", () => {
    const result = buildWagonWheelData([]);
    expect(result.zones).toHaveLength(0);
    expect(result.reason).toBeTruthy();
  });

  it("returns no-zone-data message when events exist but no zone info", () => {
    const result = buildWagonWheelData([makeEvent({ runsBatter: 4, runsTotal: 4 })]);
    expect(result.reason).toContain("No shot location data");
  });

  it("aggregates by wagon zone when zone data present", () => {
    const events = [
      makeEvent({ runsBatter: 4, runsTotal: 4, wagonZone: "cover", isBoundaryFour: true }),
      makeEvent({ runsBatter: 1, runsTotal: 1, wagonZone: "cover" }),
      makeEvent({ runsBatter: 6, runsTotal: 6, wagonZone: "mid_wicket", isBoundarySix: true }),
    ];
    const result = buildWagonWheelData(events);
    expect(result.zones.length).toBeGreaterThan(0);
    const coverZone = result.zones.find((z) => z.zoneName === "cover");
    expect(coverZone?.runs).toBe(5);
    expect(coverZone?.boundaries).toBe(1);
  });

  it("filters by batter when batterId provided", () => {
    const events = [
      makeEvent({ strikerId: "p1", runsBatter: 4, runsTotal: 4, wagonZone: "cover" }),
      makeEvent({ strikerId: "p2", runsBatter: 6, runsTotal: 6, wagonZone: "mid_on" }),
    ];
    const result = buildWagonWheelData(events, { batterId: "p1" });
    expect(result.totalRuns).toBe(4);
  });
});

// ─── inferWagonZoneFromAngle ──────────────────────────────────────────────────

describe("inferWagonZoneFromAngle", () => {
  it("classifies 0 degrees as straight", () => {
    expect(inferWagonZoneFromAngle(0)).toBe("straight");
  });
  it("classifies 90 degrees as cover", () => {
    expect(inferWagonZoneFromAngle(90)).toBe("cover");
  });
  it("classifies 270 degrees as mid_wicket", () => {
    expect(inferWagonZoneFromAngle(270)).toBe("mid_wicket");
  });
  it("handles values over 360 by wrapping", () => {
    expect(inferWagonZoneFromAngle(360)).toBe(inferWagonZoneFromAngle(0));
  });
});

// ─── classifyBattingPhase ─────────────────────────────────────────────────────

describe("classifyBattingPhase", () => {
  it("classifies overs 0-5 as powerplay", () => {
    expect(classifyBattingPhase(0)).toBe("powerplay");
    expect(classifyBattingPhase(5)).toBe("powerplay");
  });
  it("classifies overs 6-15 as middle_overs", () => {
    expect(classifyBattingPhase(6)).toBe("middle_overs");
    expect(classifyBattingPhase(15)).toBe("middle_overs");
  });
  it("classifies overs 16+ as death_overs", () => {
    expect(classifyBattingPhase(16)).toBe("death_overs");
    expect(classifyBattingPhase(19)).toBe("death_overs");
  });
});

// ─── calculateDotBallPercentage ───────────────────────────────────────────────

describe("calculateDotBallPercentage", () => {
  it("returns null for 0 balls", () => {
    expect(calculateDotBallPercentage(0, 0)).toBeNull();
  });
  it("calculates correctly: 6 dots of 12 legal = 50%", () => {
    expect(calculateDotBallPercentage(6, 12)).toBe(50);
  });
  it("returns 0 for no dots", () => {
    expect(calculateDotBallPercentage(0, 10)).toBe(0);
  });
});

// ─── calculateBoundaryPercentage ─────────────────────────────────────────────

describe("calculateBoundaryPercentage", () => {
  it("returns null for 0 balls", () => {
    expect(calculateBoundaryPercentage(0, 0)).toBeNull();
  });
  it("calculates correctly: 3 boundaries of 12 = 25%", () => {
    expect(calculateBoundaryPercentage(3, 12)).toBe(25);
  });
});

// ─── buildPhaseSummary ────────────────────────────────────────────────────────

describe("buildPhaseSummary", () => {
  it("returns 3 phase rows for T20", () => {
    const phases = buildPhaseSummary([]);
    expect(phases.length).toBe(3);
  });

  it("accumulates runs per phase", () => {
    const events = [
      makeEvent({ overNumber: 0, runsBatter: 6, runsTotal: 6, isBoundarySix: true }), // powerplay
      makeEvent({ overNumber: 10, runsBatter: 4, runsTotal: 4 }), // middle
      makeEvent({ overNumber: 18, runsBatter: 6, runsTotal: 6 }), // death
    ];
    const phases = buildPhaseSummary(events);
    const pp = phases.find((p) => p.phase === "powerplay")!;
    const mid = phases.find((p) => p.phase === "middle_overs")!;
    const death = phases.find((p) => p.phase === "death_overs")!;
    expect(pp.runs).toBe(6);
    expect(mid.runs).toBe(4);
    expect(death.runs).toBe(6);
  });
});

// ─── buildMatchMomentumData ───────────────────────────────────────────────────

describe("buildMatchMomentumData", () => {
  it("returns empty for no events", () => {
    expect(buildMatchMomentumData([], [])).toHaveLength(0);
  });

  it("returns momentum points with valid shape", () => {
    const events = [
      makeEvent({ overNumber: 0, runsBatter: 4, runsTotal: 4 }),
      makeEvent({ overNumber: 0, runsBatter: 0, runsTotal: 0 }),
    ];
    const points = buildMatchMomentumData(events, [innings1]);
    expect(points.length).toBeGreaterThan(0);
    const p = points[0]!;
    expect(typeof p.battingTeamMomentum).toBe("number");
    expect(typeof p.bowlingTeamMomentum).toBe("number");
    expect(p.battingTeamMomentum + p.bowlingTeamMomentum).toBeCloseTo(100, 0);
  });

  it("clamps momentum between 0 and 100", () => {
    const bigEvents = Array.from({ length: 6 }, (_, i) =>
      makeEvent({ overNumber: 0, ballInOver: i, runsBatter: 6, runsTotal: 6, isBoundarySix: true })
    );
    const points = buildMatchMomentumData(bigEvents, [innings1]);
    for (const p of points) {
      expect(p.battingTeamMomentum).toBeGreaterThanOrEqual(0);
      expect(p.battingTeamMomentum).toBeLessThanOrEqual(100);
    }
  });
});

// ─── summarizeMatchAnalytics ──────────────────────────────────────────────────

describe("summarizeMatchAnalytics", () => {
  it("handles all-empty input", () => {
    const summary = summarizeMatchAnalytics({ manhattan: [], partnerships: [], phases: [] });
    expect(summary.biggestOver).toBeNull();
    expect(summary.highestPartnership).toBeNull();
    expect(summary.collapseDetected).toBe(false);
  });

  it("finds biggest over", () => {
    const manhattan = [
      { inningsId: "i1", overNumber: 3, runs: 18, wickets: 0, boundaries: 3, extras: 0 },
      { inningsId: "i1", overNumber: 5, runs: 8, wickets: 0, boundaries: 1, extras: 0 },
    ];
    const summary = summarizeMatchAnalytics({ manhattan, partnerships: [], phases: [] });
    expect(summary.biggestOver?.runs).toBe(18);
    expect(summary.biggestOver?.overNumber).toBe(3);
  });

  it("detects batting collapse", () => {
    const manhattan = [
      { inningsId: "i1", overNumber: 10, runs: 4, wickets: 1, boundaries: 0, extras: 0 },
      { inningsId: "i1", overNumber: 11, runs: 2, wickets: 1, boundaries: 0, extras: 0 },
      { inningsId: "i1", overNumber: 12, runs: 1, wickets: 1, boundaries: 0, extras: 0 },
    ];
    const summary = summarizeMatchAnalytics({ manhattan, partnerships: [], phases: [] });
    expect(summary.collapseDetected).toBe(true);
  });
});
