/**
 * Pure standings calculation functions.
 * No side effects, no database access, fully testable.
 */

import type { StandingsFormResult } from "@/lib/cricket/types";

// ─── NRR helpers ─────────────────────────────────────────────────────────────

/** Convert ball count to decimal overs for NRR arithmetic (e.g. 17 → 2.833…). */
export function calculateOversFromBalls(balls: number): number {
  if (balls <= 0) return 0;
  return balls / 6;
}

export interface NrrInput {
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
}

/**
 * NRR = (runs_for / overs_for) - (runs_against / overs_against)
 * Returns 0 when either balls count is 0 (no data yet).
 */
export function calculateNetRunRate(input: NrrInput): number {
  const { runsFor, ballsFor, runsAgainst, ballsAgainst } = input;
  if (ballsFor <= 0 || ballsAgainst <= 0) return 0;
  const oversFor = calculateOversFromBalls(ballsFor);
  const oversAgainst = calculateOversFromBalls(ballsAgainst);
  const nrr = runsFor / oversFor - runsAgainst / oversAgainst;
  return parseFloat(nrr.toFixed(3));
}

export interface NormalizeInningsInput {
  ballsBowled: number;
  wicketsLost: number;
  scheduledOvers: number;
  teamAllOut: boolean;
  /** When true, use full quota if team was all out before using full overs (ICC rule). Default true. */
  useFullQuotaWhenAllOut?: boolean;
}

/**
 * Return the balls value to use for NRR denominator for this innings.
 * If team was all out, use scheduled quota (not actual balls faced).
 */
export function normalizeInningsBallsForNRR(input: NormalizeInningsInput): number {
  const { ballsBowled, wicketsLost, scheduledOvers, teamAllOut, useFullQuotaWhenAllOut = true } = input;
  const scheduledBalls = scheduledOvers * 6;
  if (teamAllOut && useFullQuotaWhenAllOut && wicketsLost >= 10) {
    return scheduledBalls;
  }
  return ballsBowled > 0 ? ballsBowled : scheduledBalls;
}

// ─── Match result to points ───────────────────────────────────────────────────

export interface PointsSettings {
  pointsWin: number;
  pointsLoss: number;
  pointsTie: number;
  pointsNoResult: number;
  bonusPointsEnabled: boolean;
  netRunRateEnabled: boolean;
}

export interface InningsData {
  battingTeamId: string;
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  allOut: boolean;
  scheduledOvers: number;
}

export interface MatchForResult {
  id: string;
  leagueId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  matchResultType: string | null;
  winningTeamId: string | null;
  losingTeamId: string | null;
  matchStatus: string;
  scorecardStatus: string;
  innings: InningsData[];
}

export interface TeamMatchResult {
  teamId: string;
  opponentTeamId: string | null;
  result: "win" | "loss" | "tie" | "no_result" | "abandoned" | "forfeit_win" | "forfeit_loss" | "draw" | "unknown";
  points: number;
  bonusPoints: number;
  runsFor: number;
  ballsFor: number;
  wicketsLost: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsTaken: number;
  netRunRateDelta: number;
}

export function calculateMatchTeamResults(
  match: MatchForResult,
  settings: PointsSettings
): TeamMatchResult[] {
  const { homeTeamId, awayTeamId, matchResultType, winningTeamId, losingTeamId } = match;

  if (!homeTeamId || !awayTeamId) return [];

  const teamIds = [homeTeamId, awayTeamId];

  // Map innings by batting team
  const inningsByTeam = new Map<string, InningsData>();
  for (const inning of match.innings) {
    if (!inningsByTeam.has(inning.battingTeamId)) {
      inningsByTeam.set(inning.battingTeamId, inning);
    }
  }

  const results: TeamMatchResult[] = [];

  for (const teamId of teamIds) {
    const opponentId = teamId === homeTeamId ? awayTeamId : homeTeamId;
    const teamInnings = inningsByTeam.get(teamId);
    const opponentInnings = inningsByTeam.get(opponentId);

    const runsFor = teamInnings?.totalRuns ?? 0;
    const ballsForRaw = teamInnings?.ballsBowled ?? 0;
    const wicketsLostCount = teamInnings?.wicketsLost ?? 0;
    const runsAgainst = opponentInnings?.totalRuns ?? 0;
    const ballsAgainstRaw = opponentInnings?.ballsBowled ?? 0;
    const wicketsTaken = opponentInnings?.wicketsLost ?? 0;

    const scheduledOvers = teamInnings?.scheduledOvers ?? 20;

    const ballsFor = normalizeInningsBallsForNRR({
      ballsBowled: ballsForRaw,
      wicketsLost: wicketsLostCount,
      scheduledOvers,
      teamAllOut: teamInnings?.allOut ?? false,
      useFullQuotaWhenAllOut: true,
    });

    const ballsAgainst = normalizeInningsBallsForNRR({
      ballsBowled: ballsAgainstRaw,
      wicketsLost: opponentInnings?.wicketsLost ?? 0,
      scheduledOvers: opponentInnings?.scheduledOvers ?? scheduledOvers,
      teamAllOut: opponentInnings?.allOut ?? false,
      useFullQuotaWhenAllOut: true,
    });

    let result: TeamMatchResult["result"] = "unknown";
    let points = 0;
    const bonusPoints = 0;

    if (matchResultType === "abandoned") {
      result = "abandoned";
      points = settings.pointsNoResult;
    } else if (matchResultType === "no_result") {
      result = "no_result";
      points = settings.pointsNoResult;
    } else if (matchResultType === "tie") {
      result = "tie";
      points = settings.pointsTie;
    } else if (matchResultType === "forfeited") {
      if (winningTeamId === teamId) {
        result = "forfeit_win";
        points = settings.pointsWin;
      } else {
        result = "forfeit_loss";
        points = settings.pointsLoss;
      }
    } else if (winningTeamId === teamId) {
      result = "win";
      points = settings.pointsWin;
    } else if (losingTeamId === teamId) {
      result = "loss";
      points = settings.pointsLoss;
    } else if (matchResultType === "draw") {
      result = "draw";
      points = settings.pointsTie;
    }

    const nrrDelta =
      settings.netRunRateEnabled
        ? calculateNetRunRate({ runsFor, ballsFor, runsAgainst, ballsAgainst })
        : 0;

    results.push({
      teamId,
      opponentTeamId: opponentId,
      result,
      points,
      bonusPoints,
      runsFor,
      ballsFor,
      wicketsLost: wicketsLostCount,
      runsAgainst,
      ballsAgainst,
      wicketsTaken,
      netRunRateDelta: nrrDelta,
    });
  }

  return results;
}

// ─── Standing aggregation ─────────────────────────────────────────────────────

export interface TeamAggregatedStanding {
  teamId: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  abandoned: number;
  forfeitsFor: number;
  forfeitsAgainst: number;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsFor: number;
  wicketsAgainst: number;
  netRunRate: number;
  form: StandingsFormResult[];
  lastMatchId: string | null;
  position: number | null;
}

export interface MatchResultForAggregation {
  matchId: string;
  teamId: string;
  result: TeamMatchResult["result"];
  points: number;
  bonusPoints: number;
  runsFor: number;
  ballsFor: number;
  wicketsLost: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsTaken: number;
}

export function aggregateTeamStandings(
  matchResults: MatchResultForAggregation[],
  teamIds: string[],
  settings: PointsSettings
): TeamAggregatedStanding[] {
  const map = new Map<string, TeamAggregatedStanding>();

  for (const teamId of teamIds) {
    map.set(teamId, {
      teamId,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      abandoned: 0,
      forfeitsFor: 0,
      forfeitsAgainst: 0,
      points: 0,
      bonusPoints: 0,
      totalPoints: 0,
      runsFor: 0,
      ballsFor: 0,
      runsAgainst: 0,
      ballsAgainst: 0,
      wicketsFor: 0,
      wicketsAgainst: 0,
      netRunRate: 0,
      form: [],
      lastMatchId: null,
      position: null,
    });
  }

  for (const mr of matchResults) {
    const s = map.get(mr.teamId);
    if (!s) continue;

    s.matchesPlayed += 1;
    s.points += mr.points;
    s.bonusPoints += mr.bonusPoints;
    s.runsFor += mr.runsFor;
    s.ballsFor += mr.ballsFor;
    s.runsAgainst += mr.runsAgainst;
    s.ballsAgainst += mr.ballsAgainst;
    s.wicketsFor += mr.wicketsTaken;
    s.wicketsAgainst += mr.wicketsLost;
    s.lastMatchId = mr.matchId;

    const formEntry = resultToFormLetter(mr.result);
    s.form = [...s.form, formEntry].slice(-5);

    switch (mr.result) {
      case "win":       s.wins += 1; break;
      case "loss":      s.losses += 1; break;
      case "tie":       s.ties += 1; break;
      case "no_result": s.noResults += 1; break;
      case "abandoned": s.abandoned += 1; break;
      case "forfeit_win": s.forfeitsFor += 1; s.wins += 1; break;
      case "forfeit_loss": s.forfeitsAgainst += 1; s.losses += 1; break;
    }
  }

  for (const s of map.values()) {
    s.totalPoints = s.points + s.bonusPoints;
    s.netRunRate = settings.netRunRateEnabled
      ? calculateNetRunRate({
          runsFor: s.runsFor,
          ballsFor: s.ballsFor,
          runsAgainst: s.runsAgainst,
          ballsAgainst: s.ballsAgainst,
        })
      : 0;
  }

  const standings = Array.from(map.values());
  return rankStandings(standings);
}

function resultToFormLetter(result: TeamMatchResult["result"]): StandingsFormResult {
  switch (result) {
    case "win":        return "W";
    case "forfeit_win": return "W";
    case "loss":       return "L";
    case "forfeit_loss": return "L";
    case "tie":        return "T";
    case "draw":       return "T";
    case "no_result":  return "NR";
    case "abandoned":  return "A";
    default:           return "NR";
  }
}

// ─── Form ────────────────────────────────────────────────────────────────────

export function calculateForm(lastResults: Array<TeamMatchResult["result"]>): StandingsFormResult[] {
  return lastResults.slice(-5).map(resultToFormLetter);
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export function rankStandings(standings: TeamAggregatedStanding[]): TeamAggregatedStanding[] {
  const sorted = [...standings].sort((a, b) => {
    // 1. Total points desc
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    // 2. NRR desc
    if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
    // 3. Wins desc
    if (b.wins !== a.wins) return b.wins - a.wins;
    // 4. Runs for desc
    if (b.runsFor !== a.runsFor) return b.runsFor - a.runsFor;
    return 0;
  });

  return sorted.map((s, i) => ({ ...s, position: i + 1 }));
}

// ─── Consistency validation ───────────────────────────────────────────────────

export interface StandingsConsistencyWarning {
  type: string;
  teamId?: string;
  message: string;
}

export function validateStandingsConsistency(
  standings: TeamAggregatedStanding[]
): StandingsConsistencyWarning[] {
  const warnings: StandingsConsistencyWarning[] = [];
  const seenTeams = new Set<string>();

  for (const s of standings) {
    if (seenTeams.has(s.teamId)) {
      warnings.push({ type: "duplicate_team", teamId: s.teamId, message: `Duplicate team ${s.teamId}` });
    }
    seenTeams.add(s.teamId);

    if (s.matchesPlayed < 0) {
      warnings.push({ type: "negative_count", teamId: s.teamId, message: `matches_played < 0` });
    }
    if (s.wins < 0 || s.losses < 0 || s.ties < 0) {
      warnings.push({ type: "negative_count", teamId: s.teamId, message: "negative win/loss/tie count" });
    }
    const accountedMatches = s.wins + s.losses + s.ties + s.noResults + s.abandoned + s.forfeitsFor + s.forfeitsAgainst;
    // wins already include forfeit_wins above, so allow small difference
    if (s.matchesPlayed > 0 && accountedMatches > s.matchesPlayed * 2) {
      warnings.push({ type: "record_mismatch", teamId: s.teamId, message: `Record totals (${accountedMatches}) seem inconsistent with matches_played (${s.matchesPlayed})` });
    }
  }

  return warnings;
}
