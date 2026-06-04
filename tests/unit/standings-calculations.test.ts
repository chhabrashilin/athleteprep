import { describe, it, expect } from "vitest";
import {
  calculateOversFromBalls,
  calculateNetRunRate,
  normalizeInningsBallsForNRR,
  calculateMatchTeamResults,
  aggregateTeamStandings,
  calculateForm,
  rankStandings,
  validateStandingsConsistency,
} from "@/lib/cricket/standings/calculations";
import type { MatchForResult, PointsSettings, TeamAggregatedStanding } from "@/lib/cricket/standings/calculations";

const DEFAULT_SETTINGS: PointsSettings = {
  pointsWin: 2,
  pointsLoss: 0,
  pointsTie: 1,
  pointsNoResult: 1,
  bonusPointsEnabled: false,
  netRunRateEnabled: true,
};

// ─── calculateOversFromBalls ────────────────────────────────────────────────

describe("calculateOversFromBalls", () => {
  it("returns 0 for 0 balls", () => {
    expect(calculateOversFromBalls(0)).toBe(0);
  });

  it("returns 0 for negative balls", () => {
    expect(calculateOversFromBalls(-5)).toBe(0);
  });

  it("converts 6 balls to 1.0", () => {
    expect(calculateOversFromBalls(6)).toBeCloseTo(1.0);
  });

  it("converts 120 balls to 20.0", () => {
    expect(calculateOversFromBalls(120)).toBeCloseTo(20.0);
  });
});

// ─── calculateNetRunRate ────────────────────────────────────────────────────

describe("calculateNetRunRate", () => {
  it("returns 0 when no balls faced", () => {
    expect(calculateNetRunRate({ runsFor: 100, ballsFor: 0, runsAgainst: 80, ballsAgainst: 120 })).toBe(0);
  });

  it("returns 0 when no balls bowled", () => {
    expect(calculateNetRunRate({ runsFor: 100, ballsFor: 120, runsAgainst: 80, ballsAgainst: 0 })).toBe(0);
  });

  it("returns positive NRR when team scored faster", () => {
    // 150/20 overs = 7.5 RPO; 120/20 overs = 6.0 RPO => NRR = +1.500
    const nrr = calculateNetRunRate({ runsFor: 150, ballsFor: 120, runsAgainst: 120, ballsAgainst: 120 });
    expect(nrr).toBeCloseTo(1.5, 2);
  });

  it("returns negative NRR when team scored slower", () => {
    const nrr = calculateNetRunRate({ runsFor: 120, ballsFor: 120, runsAgainst: 150, ballsAgainst: 120 });
    expect(nrr).toBeCloseTo(-1.5, 2);
  });

  it("returns 0 NRR for equal rates", () => {
    const nrr = calculateNetRunRate({ runsFor: 150, ballsFor: 120, runsAgainst: 150, ballsAgainst: 120 });
    expect(nrr).toBeCloseTo(0, 3);
  });
});

// ─── normalizeInningsBallsForNRR ─────────────────────────────────────────────

describe("normalizeInningsBallsForNRR", () => {
  it("returns actual balls if team not all out", () => {
    const result = normalizeInningsBallsForNRR({
      ballsBowled: 90,
      wicketsLost: 7,
      scheduledOvers: 20,
      teamAllOut: false,
    });
    expect(result).toBe(90);
  });

  it("returns full quota balls when team all out with useFullQuotaWhenAllOut=true", () => {
    const result = normalizeInningsBallsForNRR({
      ballsBowled: 60,
      wicketsLost: 10,
      scheduledOvers: 20,
      teamAllOut: true,
      useFullQuotaWhenAllOut: true,
    });
    expect(result).toBe(120); // 20 * 6
  });

  it("returns actual balls when useFullQuotaWhenAllOut=false", () => {
    const result = normalizeInningsBallsForNRR({
      ballsBowled: 60,
      wicketsLost: 10,
      scheduledOvers: 20,
      teamAllOut: true,
      useFullQuotaWhenAllOut: false,
    });
    expect(result).toBe(60);
  });

  it("returns scheduled balls when ballsBowled=0", () => {
    const result = normalizeInningsBallsForNRR({
      ballsBowled: 0,
      wicketsLost: 0,
      scheduledOvers: 20,
      teamAllOut: false,
    });
    expect(result).toBe(120);
  });
});

// ─── calculateMatchTeamResults ───────────────────────────────────────────────

describe("calculateMatchTeamResults", () => {
  const homeId = "home-team";
  const awayId = "away-team";

  function makeMatch(overrides: Partial<MatchForResult> = {}): MatchForResult {
    return {
      id: "match-1",
      leagueId: "league-1",
      homeTeamId: homeId,
      awayTeamId: awayId,
      matchResultType: null,
      winningTeamId: null,
      losingTeamId: null,
      matchStatus: "completed",
      scorecardStatus: "completed",
      innings: [
        { battingTeamId: homeId, totalRuns: 150, wicketsLost: 7, ballsBowled: 120, allOut: false, scheduledOvers: 20 },
        { battingTeamId: awayId, totalRuns: 140, wicketsLost: 8, ballsBowled: 120, allOut: false, scheduledOvers: 20 },
      ],
      ...overrides,
    };
  }

  it("returns 2 results (one per team)", () => {
    const results = calculateMatchTeamResults(makeMatch({ matchResultType: "home_win", winningTeamId: homeId, losingTeamId: awayId }), DEFAULT_SETTINGS);
    expect(results).toHaveLength(2);
  });

  it("gives winner 2 points and loser 0 points", () => {
    const results = calculateMatchTeamResults(
      makeMatch({ matchResultType: "home_win", winningTeamId: homeId, losingTeamId: awayId }),
      DEFAULT_SETTINGS
    );
    const homeResult = results.find((r) => r.teamId === homeId);
    const awayResult = results.find((r) => r.teamId === awayId);
    expect(homeResult?.result).toBe("win");
    expect(homeResult?.points).toBe(2);
    expect(awayResult?.result).toBe("loss");
    expect(awayResult?.points).toBe(0);
  });

  it("gives both teams 1 point for tie", () => {
    const results = calculateMatchTeamResults(
      makeMatch({ matchResultType: "tie", winningTeamId: null, losingTeamId: null }),
      DEFAULT_SETTINGS
    );
    expect(results.every((r) => r.points === 1)).toBe(true);
    expect(results.every((r) => r.result === "tie")).toBe(true);
  });

  it("gives both teams 1 point for no_result", () => {
    const results = calculateMatchTeamResults(
      makeMatch({ matchResultType: "no_result" }),
      DEFAULT_SETTINGS
    );
    expect(results.every((r) => r.points === 1)).toBe(true);
    expect(results.every((r) => r.result === "no_result")).toBe(true);
  });

  it("gives both teams 1 point for abandoned", () => {
    const results = calculateMatchTeamResults(
      makeMatch({ matchResultType: "abandoned" }),
      DEFAULT_SETTINGS
    );
    expect(results.every((r) => r.points === 1)).toBe(true);
    expect(results.every((r) => r.result === "abandoned")).toBe(true);
  });

  it("returns positive NRR for team that scored faster", () => {
    const results = calculateMatchTeamResults(
      makeMatch({ matchResultType: "home_win", winningTeamId: homeId, losingTeamId: awayId }),
      DEFAULT_SETTINGS
    );
    const homeResult = results.find((r) => r.teamId === homeId);
    expect(homeResult?.netRunRateDelta).toBeGreaterThan(0);
  });

  it("returns empty array if no team IDs", () => {
    const match: MatchForResult = {
      id: "x", leagueId: null, homeTeamId: null, awayTeamId: null,
      matchResultType: null, winningTeamId: null, losingTeamId: null,
      matchStatus: "completed", scorecardStatus: "completed", innings: [],
    };
    expect(calculateMatchTeamResults(match, DEFAULT_SETTINGS)).toHaveLength(0);
  });
});

// ─── calculateForm ─────────────────────────────────────────────────────────

describe("calculateForm", () => {
  it("maps win to W", () => {
    expect(calculateForm(["win"])).toEqual(["W"]);
  });

  it("maps loss to L", () => {
    expect(calculateForm(["loss"])).toEqual(["L"]);
  });

  it("maps tie to T", () => {
    expect(calculateForm(["tie"])).toEqual(["T"]);
  });

  it("maps no_result to NR", () => {
    expect(calculateForm(["no_result"])).toEqual(["NR"]);
  });

  it("maps abandoned to A", () => {
    expect(calculateForm(["abandoned"])).toEqual(["A"]);
  });

  it("limits to last 5 results", () => {
    const form = calculateForm(["win", "win", "loss", "win", "tie", "loss"]);
    expect(form).toHaveLength(5);
    expect(form[0]).toBe("W");
  });
});

// ─── rankStandings ─────────────────────────────────────────────────────────

describe("rankStandings", () => {
  function makeStanding(overrides: Partial<TeamAggregatedStanding>): TeamAggregatedStanding {
    return {
      teamId: "team-1",
      matchesPlayed: 4,
      wins: 2,
      losses: 2,
      ties: 0,
      noResults: 0,
      abandoned: 0,
      forfeitsFor: 0,
      forfeitsAgainst: 0,
      points: 4,
      bonusPoints: 0,
      totalPoints: 4,
      runsFor: 600,
      ballsFor: 480,
      runsAgainst: 560,
      ballsAgainst: 480,
      wicketsFor: 20,
      wicketsAgainst: 18,
      netRunRate: 0.5,
      form: ["W", "L", "W", "L"],
      lastMatchId: null,
      position: null,
      ...overrides,
    };
  }

  it("ranks by total_points descending", () => {
    const standings = [
      makeStanding({ teamId: "a", totalPoints: 6 }),
      makeStanding({ teamId: "b", totalPoints: 8 }),
      makeStanding({ teamId: "c", totalPoints: 4 }),
    ];
    const ranked = rankStandings(standings);
    expect(ranked[0].teamId).toBe("b");
    expect(ranked[1].teamId).toBe("a");
    expect(ranked[2].teamId).toBe("c");
  });

  it("breaks ties by NRR descending", () => {
    const standings = [
      makeStanding({ teamId: "a", totalPoints: 6, netRunRate: 0.5 }),
      makeStanding({ teamId: "b", totalPoints: 6, netRunRate: 1.2 }),
    ];
    const ranked = rankStandings(standings);
    expect(ranked[0].teamId).toBe("b");
  });

  it("assigns position numbers starting from 1", () => {
    const standings = [
      makeStanding({ teamId: "a", totalPoints: 6 }),
      makeStanding({ teamId: "b", totalPoints: 4 }),
    ];
    const ranked = rankStandings(standings);
    expect(ranked[0].position).toBe(1);
    expect(ranked[1].position).toBe(2);
  });
});

// ─── aggregateTeamStandings ─────────────────────────────────────────────────

describe("aggregateTeamStandings", () => {
  it("accumulates wins and points correctly", () => {
    const matchResults = [
      { matchId: "m1", teamId: "a", result: "win" as const, points: 2, bonusPoints: 0, runsFor: 150, ballsFor: 120, wicketsLost: 5, runsAgainst: 130, ballsAgainst: 120, wicketsTaken: 6 },
      { matchId: "m1", teamId: "b", result: "loss" as const, points: 0, bonusPoints: 0, runsFor: 130, ballsFor: 120, wicketsLost: 6, runsAgainst: 150, ballsAgainst: 120, wicketsTaken: 5 },
      { matchId: "m2", teamId: "a", result: "win" as const, points: 2, bonusPoints: 0, runsFor: 160, ballsFor: 120, wicketsLost: 4, runsAgainst: 140, ballsAgainst: 120, wicketsTaken: 7 },
      { matchId: "m2", teamId: "b", result: "loss" as const, points: 0, bonusPoints: 0, runsFor: 140, ballsFor: 120, wicketsLost: 7, runsAgainst: 160, ballsAgainst: 120, wicketsTaken: 4 },
    ];
    const standings = aggregateTeamStandings(matchResults, ["a", "b"], DEFAULT_SETTINGS);
    const teamA = standings.find((s) => s.teamId === "a");
    const teamB = standings.find((s) => s.teamId === "b");
    expect(teamA?.wins).toBe(2);
    expect(teamA?.totalPoints).toBe(4);
    expect(teamB?.losses).toBe(2);
    expect(teamB?.totalPoints).toBe(0);
    expect(teamA?.position).toBe(1);
  });

  it("includes teams with no matches at 0", () => {
    const standings = aggregateTeamStandings([], ["team-x"], DEFAULT_SETTINGS);
    expect(standings).toHaveLength(1);
    expect(standings[0].matchesPlayed).toBe(0);
    expect(standings[0].totalPoints).toBe(0);
  });
});

// ─── validateStandingsConsistency ───────────────────────────────────────────

describe("validateStandingsConsistency", () => {
  it("returns no warnings for valid standings", () => {
    const s: TeamAggregatedStanding = {
      teamId: "a", matchesPlayed: 3, wins: 2, losses: 1, ties: 0, noResults: 0,
      abandoned: 0, forfeitsFor: 0, forfeitsAgainst: 0, points: 4, bonusPoints: 0, totalPoints: 4,
      runsFor: 400, ballsFor: 360, runsAgainst: 350, ballsAgainst: 360,
      wicketsFor: 15, wicketsAgainst: 10, netRunRate: 0.83, form: ["W", "L", "W"],
      lastMatchId: null, position: 1,
    };
    expect(validateStandingsConsistency([s])).toHaveLength(0);
  });

  it("flags duplicate teams", () => {
    const s: TeamAggregatedStanding = {
      teamId: "a", matchesPlayed: 1, wins: 1, losses: 0, ties: 0, noResults: 0,
      abandoned: 0, forfeitsFor: 0, forfeitsAgainst: 0, points: 2, bonusPoints: 0, totalPoints: 2,
      runsFor: 150, ballsFor: 120, runsAgainst: 130, ballsAgainst: 120,
      wicketsFor: 5, wicketsAgainst: 4, netRunRate: 1.0, form: ["W"],
      lastMatchId: null, position: 1,
    };
    const warnings = validateStandingsConsistency([s, s]);
    expect(warnings.some((w) => w.type === "duplicate_team")).toBe(true);
  });
});
