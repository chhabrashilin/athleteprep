/**
 * tests/unit/overlay-data.test.ts
 * Tests for overlay data builder utilities.
 */

import { describe, it, expect } from "vitest";
import {
  buildScorebugOverlayData,
  buildTossOverlayData,
  buildInningsBreakOverlayData,
  buildResultOverlayData,
  sanitizeOverlayData,
  getOverlayStatus,
} from "@/lib/cricket/overlays/data";

const HOME_ID = "home-team-id";
const AWAY_ID = "away-team-id";

const makeLiveState = (overrides = {}) => ({
  totalRuns: 145,
  wicketsLost: 6,
  oversText: "18.3",
  currentRunRate: 7.84,
  requiredRunRate: null,
  targetRuns: null,
  status: "live",
  strikerId: "player-1",
  nonStrikerId: "player-2",
  bowlerId: "player-3",
  ...overrides,
});

describe("buildScorebugOverlayData", () => {
  it("formats score text correctly", () => {
    const data = buildScorebugOverlayData({
      matchTitle: "Home vs Away",
      leagueName: "Test League",
      homeTeamName: "Home XI",
      homeTeamId: HOME_ID,
      homeTeamShortName: "HXI",
      awayTeamName: "Away XI",
      awayTeamId: AWAY_ID,
      awayTeamShortName: "AXI",
      battingTeamId: HOME_ID,
      liveState: makeLiveState(),
      striker: { id: "p1", name: "Striker" },
      nonStriker: { id: "p2", name: "Non-Striker" },
      bowler: { id: "p3", name: "Bowler" },
      strikerRuns: 45,
      strikerBalls: 32,
      nonStrikerRuns: 12,
      nonStrikerBalls: 18,
      bowlerWickets: 2,
      bowlerRuns: 28,
      bowlerOvers: "4.0",
      lastBalls: [{ notation: "4", isWicket: false, isBoundaryFour: true, isBoundarySix: false, isLegal: true }],
    });

    expect(data.scoreText).toBe("145/6");
    expect(data.oversText).toBe("18.3");
    expect(data.battingTeamShortName).toBe("HXI");
    expect(data.bowlingTeamShortName).toBe("AXI");
    expect(data.strikerName).toBe("Striker");
    expect(data.strikerRunsBalls).toBe("45(32)");
    expect(data.bowlerFigures).toBe("2/28 (4.0)");
    expect(data.lastBalls).toHaveLength(1);
    expect(data.lastBalls[0]).toBe("4");
  });

  it("handles missing live state gracefully", () => {
    const data = buildScorebugOverlayData({
      matchTitle: "Test",
      leagueName: null,
      homeTeamName: "Home",
      homeTeamId: HOME_ID,
      awayTeamName: "Away",
      awayTeamId: AWAY_ID,
      battingTeamId: null,
      liveState: null,
      striker: null, nonStriker: null, bowler: null,
      strikerRuns: null, strikerBalls: null,
      nonStrikerRuns: null, nonStrikerBalls: null,
      bowlerWickets: null, bowlerRuns: null, bowlerOvers: null,
      lastBalls: [],
    });
    expect(data.scoreText).toBe("0/0");
    expect(data.strikerName).toBeNull();
    expect(data.bowlerName).toBeNull();
    expect(data.lastBalls).toHaveLength(0);
  });

  it("includes chase info when target is set", () => {
    const data = buildScorebugOverlayData({
      matchTitle: "Chase Test",
      leagueName: null,
      homeTeamName: "Home",
      homeTeamId: HOME_ID,
      awayTeamName: "Away",
      awayTeamId: AWAY_ID,
      battingTeamId: AWAY_ID,
      liveState: makeLiveState({ targetRuns: 180, requiredRunRate: 9.5, totalRuns: 80, wicketsLost: 2 }),
      striker: null, nonStriker: null, bowler: null,
      strikerRuns: null, strikerBalls: null,
      nonStrikerRuns: null, nonStrikerBalls: null,
      bowlerWickets: null, bowlerRuns: null, bowlerOvers: null,
      lastBalls: [],
    });
    expect(data.targetText).toBeTruthy();
    expect(data.targetText).toContain("100");
  });
});

describe("buildTossOverlayData", () => {
  it("identifies toss winner correctly", () => {
    const data = buildTossOverlayData({
      tossWonByTeamId: HOME_ID,
      tossDecision: "bat",
      homeTeamName: "Lions",
      homeTeamId: HOME_ID,
      awayTeamName: "Tigers",
      awayTeamId: AWAY_ID,
      venueName: "Test Ground",
      matchTitle: "Lions vs Tigers",
    });
    expect(data.tossWinner).toBe("Lions");
    expect(data.decision).toBe("bat");
  });

  it("identifies away team as toss winner", () => {
    const data = buildTossOverlayData({
      tossWonByTeamId: AWAY_ID,
      tossDecision: "field",
      homeTeamName: "Lions",
      homeTeamId: HOME_ID,
      awayTeamName: "Tigers",
      awayTeamId: AWAY_ID,
      venueName: null,
      matchTitle: "Test",
    });
    expect(data.tossWinner).toBe("Tigers");
  });
});

describe("buildInningsBreakOverlayData", () => {
  it("computes chase requirement correctly", () => {
    const data = buildInningsBreakOverlayData({
      firstInningsTeam: "Team A",
      firstInningsTotal: 160,
      firstInningsWickets: 8,
      firstInningsOvers: "20.0",
      targetRuns: 161,
      oversLimit: 20,
      topBatterName: "Player X",
      topBatterRuns: 62,
      topBatterBalls: 45,
      topBowlerName: "Bowler Y",
      topBowlerWickets: 3,
      topBowlerRuns: 28,
      topBowlerOvers: "4.0",
    });
    expect(data.score).toBe("160/8");
    expect(data.target).toBe(161);
    expect(data.chaseRequirement).toContain("1 runs");
    expect(data.topBatter).toBe("Player X");
    expect(data.topBowlerFigures).toBe("3/28 (4.0)");
  });
});

describe("buildResultOverlayData", () => {
  it("formats runs win correctly", () => {
    const data = buildResultOverlayData({
      winnerTeamName: "Champions",
      winMargin: 42,
      winMarginType: "runs",
      playerOfMatchName: "Star Player",
      team1Name: "Champions", team1Total: 180, team1Wickets: 6, team1Overs: "20.0",
      team2Name: "Challengers", team2Total: 138, team2Wickets: 10, team2Overs: "18.4",
      matchTitle: "Final",
    });
    expect(data.margin).toBe("Champions won by 42 runs");
    expect(data.playerOfMatch).toBe("Star Player");
  });

  it("formats wickets win correctly", () => {
    const data = buildResultOverlayData({
      winnerTeamName: "Hunters",
      winMargin: 5,
      winMarginType: "wickets",
      playerOfMatchName: null,
      team1Name: "A", team1Total: 140, team1Wickets: 10, team1Overs: "19.2",
      team2Name: "Hunters", team2Total: 141, team2Wickets: 5, team2Overs: "18.1",
      matchTitle: "Test",
    });
    expect(data.margin).toContain("5 wickets");
  });

  it("formats tie correctly", () => {
    const data = buildResultOverlayData({
      winnerTeamName: "Tied",
      winMargin: null,
      winMarginType: "tie",
      playerOfMatchName: null,
      team1Name: "A", team1Total: 150, team1Wickets: 8, team1Overs: "20.0",
      team2Name: "B", team2Total: 150, team2Wickets: 9, team2Overs: "20.0",
      matchTitle: "Test",
    });
    expect(data.margin).toBe("Match tied");
  });
});

describe("sanitizeOverlayData", () => {
  it("removes private fields", () => {
    const input = {
      matchTitle: "Test",
      email: "admin@example.com",
      stream_key: "sk_live_abc123",
      token_hash: "abc123hash",
      scoreText: "145/6",
    };
    const result = sanitizeOverlayData(input);
    expect(result.matchTitle).toBe("Test");
    expect(result.scoreText).toBe("145/6");
    expect("email" in result).toBe(false);
    expect("stream_key" in result).toBe(false);
    expect("token_hash" in result).toBe(false);
  });

  it("recursively sanitizes nested objects", () => {
    const input = {
      match: {
        title: "Test",
        internal_notes: "Secret notes",
      },
    };
    const result = sanitizeOverlayData(input as Record<string, unknown>);
    expect((result.match as Record<string, unknown>).title).toBe("Test");
    expect("internal_notes" in (result.match as Record<string, unknown>)).toBe(false);
  });
});

describe("getOverlayStatus", () => {
  it("returns not_configured when no match", () => {
    expect(getOverlayStatus(null, null, null)).toBe("not_configured");
  });

  it("returns completed for completed match", () => {
    expect(getOverlayStatus("completed", "ended", null)).toBe("completed");
  });

  it("returns live when stream is live", () => {
    expect(getOverlayStatus("live", "live", "live")).toBe("live");
  });

  it("returns innings_break when match is innings_break", () => {
    expect(getOverlayStatus("innings_break", "live", null)).toBe("innings_break");
  });

  it("returns ready when stream is scheduled", () => {
    expect(getOverlayStatus("scheduled", "scheduled", null)).toBe("ready");
  });

  it("returns error for failed stream", () => {
    expect(getOverlayStatus("live", "failed", null)).toBe("error");
  });
});
