/**
 * Pure player statistics calculation functions.
 * No side effects, no database access, fully testable.
 */

import type { CricketLeaderboardType } from "@/lib/cricket/types";

// ─── Batting ──────────────────────────────────────────────────────────────────

/** Batting average = runs / outs. Returns null when no dismissals. */
export function calculateBattingAverage(runs: number, outs: number): number | null {
  if (outs <= 0) return null;
  return parseFloat((runs / outs).toFixed(2));
}

/** Strike rate = (runs / balls) × 100. Returns null when no balls faced. */
export function calculateBattingStrikeRate(runs: number, balls: number): number | null {
  if (balls <= 0) return null;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

// ─── Bowling ──────────────────────────────────────────────────────────────────

/** Bowling average = runs conceded / wickets. Returns null when no wickets. */
export function calculateBowlingAverage(runsConceded: number, wickets: number): number | null {
  if (wickets <= 0) return null;
  return parseFloat((runsConceded / wickets).toFixed(2));
}

/** Economy rate = runs conceded per over (6 balls). Returns null when no balls bowled. */
export function calculateEconomyRate(runsConceded: number, ballsBowled: number): number | null {
  if (ballsBowled <= 0) return null;
  return parseFloat(((runsConceded / ballsBowled) * 6).toFixed(2));
}

/** Bowling strike rate = balls per wicket. Returns null when no wickets. */
export function calculateBowlingStrikeRate(ballsBowled: number, wickets: number): number | null {
  if (wickets <= 0) return null;
  return parseFloat((ballsBowled / wickets).toFixed(2));
}

// ─── Best figures ─────────────────────────────────────────────────────────────

export interface BowlingEntry {
  wickets: number;
  runsConceded: number;
}

export interface BestBowling {
  wickets: number;
  runs: number;
}

/** Best bowling figures: most wickets, then fewest runs on equal wickets. */
export function calculateBestBowling(entries: BowlingEntry[]): BestBowling | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets;
    return a.runsConceded - b.runsConceded;
  });
  const best = sorted[0];
  return { wickets: best.wickets, runs: best.runsConceded };
}

// ─── Highest score ────────────────────────────────────────────────────────────

export interface BattingEntry {
  runs: number;
  isOut: boolean;
  didNotBat?: boolean;
}

export interface HighestScore {
  runs: number;
  notOut: boolean;
}

/** Highest score from a set of batting entries. */
export function calculateHighestScore(entries: BattingEntry[]): HighestScore | null {
  const valid = entries.filter((e) => !e.didNotBat);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => b.runs - a.runs);
  const top = sorted[0];
  return { runs: top.runs, notOut: !top.isOut };
}

// ─── Aggregate player stats from scorecard data ───────────────────────────────

export interface ScorecardBattingRow {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  didNotBat: boolean;
  retiredHurt?: boolean;
  retiredOut?: boolean;
}

export interface ScorecardBowlingRow {
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
}

export interface ScorecardFieldingRow {
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface PlayerScorecardData {
  matchId: string;
  batting: ScorecardBattingRow | null;
  bowling: ScorecardBowlingRow | null;
  fielding?: ScorecardFieldingRow | null;
}

export interface AggregatedPlayerStats {
  matchesPlayed: number;
  inningsBatted: number;
  notOuts: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  highestScore: number;
  highestScoreNotOut: boolean;
  battingAverage: number | null;
  battingStrikeRate: number | null;
  ducks: number;
  fifties: number;
  hundreds: number;
  inningsBowled: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  bowlingAverage: number | null;
  economyRate: number | null;
  bowlingStrikeRate: number | null;
  bestBowlingWickets: number;
  bestBowlingRuns: number | null;
  catches: number;
  stumpings: number;
  runOuts: number;
}

export function aggregatePlayerStatsFromScorecards(
  scorecards: PlayerScorecardData[]
): AggregatedPlayerStats {
  const matchIds = new Set<string>();

  let inningsBatted = 0;
  let notOuts = 0;
  let runs = 0;
  let ballsFaced = 0;
  let fours = 0;
  let sixes = 0;
  let ducks = 0;
  let fifties = 0;
  let hundreds = 0;
  let highestScore = 0;
  let highestScoreNotOut = false;

  const battingEntries: BattingEntry[] = [];

  let inningsBowled = 0;
  let ballsBowled = 0;
  let runsConceded = 0;
  let wickets = 0;
  let maidens = 0;
  let wides = 0;
  let noBalls = 0;

  const bowlingEntries: BowlingEntry[] = [];

  let catches = 0;
  let stumpings = 0;
  let runOuts = 0;

  for (const sc of scorecards) {
    matchIds.add(sc.matchId);

    if (sc.batting && !sc.batting.didNotBat) {
      inningsBatted++;
      if (!sc.batting.isOut && !sc.batting.retiredHurt) notOuts++;
      runs += sc.batting.runs;
      ballsFaced += sc.batting.balls;
      fours += sc.batting.fours;
      sixes += sc.batting.sixes;
      if (sc.batting.runs === 0 && sc.batting.isOut) ducks++;
      if (sc.batting.runs >= 50 && sc.batting.runs < 100) fifties++;
      if (sc.batting.runs >= 100) hundreds++;

      battingEntries.push({
        runs: sc.batting.runs,
        isOut: sc.batting.isOut,
        didNotBat: sc.batting.didNotBat,
      });

      if (sc.batting.runs > highestScore) {
        highestScore = sc.batting.runs;
        highestScoreNotOut = !sc.batting.isOut;
      } else if (sc.batting.runs === highestScore && !sc.batting.isOut) {
        highestScoreNotOut = true;
      }
    }

    if (sc.bowling && sc.bowling.ballsBowled > 0) {
      inningsBowled++;
      ballsBowled += sc.bowling.ballsBowled;
      runsConceded += sc.bowling.runsConceded;
      wickets += sc.bowling.wickets;
      maidens += sc.bowling.maidens;
      wides += sc.bowling.wides;
      noBalls += sc.bowling.noBalls;
      bowlingEntries.push({ wickets: sc.bowling.wickets, runsConceded: sc.bowling.runsConceded });
    }

    if (sc.fielding) {
      catches += sc.fielding.catches;
      stumpings += sc.fielding.stumpings;
      runOuts += sc.fielding.runOuts;
    }
  }

  const outs = inningsBatted - notOuts;
  const best = calculateBestBowling(bowlingEntries);

  return {
    matchesPlayed: matchIds.size,
    inningsBatted,
    notOuts,
    runs,
    ballsFaced,
    fours,
    sixes,
    highestScore,
    highestScoreNotOut,
    battingAverage: calculateBattingAverage(runs, outs),
    battingStrikeRate: calculateBattingStrikeRate(runs, ballsFaced),
    ducks,
    fifties,
    hundreds,
    inningsBowled,
    ballsBowled,
    runsConceded,
    wickets,
    maidens,
    wides,
    noBalls,
    bowlingAverage: calculateBowlingAverage(runsConceded, wickets),
    economyRate: calculateEconomyRate(runsConceded, ballsBowled),
    bowlingStrikeRate: calculateBowlingStrikeRate(ballsBowled, wickets),
    bestBowlingWickets: best?.wickets ?? 0,
    bestBowlingRuns: best?.runs ?? null,
    catches,
    stumpings,
    runOuts,
  };
}

// ─── All-rounder index ────────────────────────────────────────────────────────

export interface AllRounderInput {
  battingAverage: number | null;
  battingStrikeRate: number | null;
  bowlingAverage: number | null;
  economyRate: number | null;
  catches: number;
}

/**
 * Simple all-rounder index: normalized batting + bowling contributions.
 * Conservative formula — does not overclaim.
 */
export function calculateAllRounderIndex(stats: AllRounderInput): number {
  let score = 0;

  if (stats.battingAverage !== null) {
    score += Math.min(stats.battingAverage / 50, 1) * 40;
  }
  if (stats.battingStrikeRate !== null) {
    score += Math.min(stats.battingStrikeRate / 150, 1) * 20;
  }
  if (stats.bowlingAverage !== null) {
    const bowlScore = Math.max(0, 1 - stats.bowlingAverage / 40);
    score += bowlScore * 30;
  }
  if (stats.economyRate !== null) {
    const econScore = Math.max(0, 1 - stats.economyRate / 12);
    score += econScore * 10;
  }

  return parseFloat(score.toFixed(2));
}

// ─── Leaderboard ranking ──────────────────────────────────────────────────────

export interface PlayerStatsForRanking {
  playerId: string;
  playerName: string;
  teamId: string | null;
  teamName: string | null;
  matchesPlayed: number;
  inningsBatted: number;
  ballsFaced: number;
  inningsBowled: number;
  ballsBowled: number;
  runs: number;
  highestScore: number;
  battingAverage: number | null;
  battingStrikeRate: number | null;
  wickets: number;
  bowlingAverage: number | null;
  economyRate: number | null;
  bowlingStrikeRate: number | null;
  catches: number;
  stumpings: number;
  runOuts: number;
  allRounderIndex?: number;
}

export interface LeaderboardFilters {
  minMatches?: number;
  minInnings?: number;
  minBalls?: number;
}

export function rankPlayers(
  stats: PlayerStatsForRanking[],
  leaderboardType: CricketLeaderboardType,
  filters: LeaderboardFilters = {}
): PlayerStatsForRanking[] {
  const { minMatches = 0, minInnings = 0, minBalls = 0 } = filters;

  const filtered = stats.filter((s) => {
    if (s.matchesPlayed < minMatches) return false;
    if (s.inningsBatted < minInnings) return false;
    if (s.ballsFaced < minBalls) return false;
    return true;
  });

  switch (leaderboardType) {
    case "batting_runs":
      return filtered.sort((a, b) => b.runs - a.runs);
    case "batting_average":
      return filtered
        .filter((s) => s.battingAverage !== null)
        .sort((a, b) => (b.battingAverage ?? 0) - (a.battingAverage ?? 0));
    case "batting_strike_rate":
      return filtered
        .filter((s) => s.battingStrikeRate !== null)
        .sort((a, b) => (b.battingStrikeRate ?? 0) - (a.battingStrikeRate ?? 0));
    case "highest_score":
      return filtered.sort((a, b) => b.highestScore - a.highestScore);
    case "bowling_wickets":
      return filtered.sort((a, b) => b.wickets - a.wickets);
    case "bowling_average":
      return filtered
        .filter((s) => s.bowlingAverage !== null)
        .sort((a, b) => (a.bowlingAverage ?? Infinity) - (b.bowlingAverage ?? Infinity));
    case "economy_rate":
      return filtered
        .filter((s) => s.economyRate !== null)
        .sort((a, b) => (a.economyRate ?? Infinity) - (b.economyRate ?? Infinity));
    case "bowling_strike_rate":
      return filtered
        .filter((s) => s.bowlingStrikeRate !== null)
        .sort((a, b) => (a.bowlingStrikeRate ?? Infinity) - (b.bowlingStrikeRate ?? Infinity));
    case "fielding_catches":
      return filtered.sort((a, b) => b.catches - a.catches);
    case "all_rounder_index":
      return filtered.sort((a, b) => (b.allRounderIndex ?? 0) - (a.allRounderIndex ?? 0));
    default:
      return filtered;
  }
}
