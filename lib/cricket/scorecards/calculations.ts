/**
 * Pure scorecard calculation functions.
 * No side effects, no database access, fully testable.
 */

// ─── Overs conversion ─────────────────────────────────────────────────────────

/** Convert ball count to overs.balls notation. e.g. 17 → "2.5" */
export function ballsToOversText(balls: number): string {
  if (balls < 0) return "0.0";
  const completedOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return `${completedOvers}.${remainingBalls}`;
}

/** Convert overs.balls text to total ball count. e.g. "2.5" → 17 */
export function oversTextToBalls(oversText: string): number {
  const parts = oversText.split(".");
  if (parts.length > 2) throw new Error(`Invalid overs notation: ${oversText}`);

  const overs = parseInt(parts[0], 10);
  const balls = parts.length === 2 ? parseInt(parts[1], 10) : 0;

  if (isNaN(overs) || isNaN(balls)) {
    throw new Error(`Invalid overs notation: ${oversText}`);
  }
  if (overs < 0 || balls < 0) {
    throw new Error(`Invalid overs notation (negative values): ${oversText}`);
  }
  if (balls > 5) {
    throw new Error(`Invalid overs notation (balls digit must be 0-5, got ${balls}): ${oversText}`);
  }

  return overs * 6 + balls;
}

// ─── Rate calculations ────────────────────────────────────────────────────────

/** Strike rate = (runs / balls) × 100. Returns null if balls = 0. */
export function calculateStrikeRate(runs: number, balls: number): number | null {
  if (balls === 0) return null;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

/** Economy rate = runs conceded per over. Returns null if balls = 0. */
export function calculateEconomyRate(runsConceded: number, ballsBowled: number): number | null {
  if (ballsBowled === 0) return null;
  return parseFloat(((runsConceded / ballsBowled) * 6).toFixed(2));
}

/** Run rate = runs per over bowled so far. Returns null if balls = 0. */
export function calculateRunRate(totalRuns: number, ballsBowled: number): number | null {
  if (ballsBowled === 0) return null;
  return parseFloat(((totalRuns / ballsBowled) * 6).toFixed(2));
}

/** Required run rate. Returns null if no balls remaining. */
export function calculateRequiredRunRate(
  targetRuns: number,
  currentRuns: number,
  ballsRemaining: number
): number | null {
  if (ballsRemaining <= 0) return null;
  const needed = targetRuns - currentRuns;
  if (needed <= 0) return 0;
  return parseFloat(((needed / ballsRemaining) * 6).toFixed(2));
}

// ─── Extras and totals ────────────────────────────────────────────────────────

export interface ExtrasInput {
  byes?: number;
  legByes?: number;
  wides?: number;
  noBalls?: number;
  penaltyRuns?: number;
}

/** Sum all extras. */
export function calculateExtrasTotal(extras: ExtrasInput): number {
  return (
    (extras.byes ?? 0) +
    (extras.legByes ?? 0) +
    (extras.wides ?? 0) +
    (extras.noBalls ?? 0) +
    (extras.penaltyRuns ?? 0)
  );
}

export interface InningsTotalInput extends ExtrasInput {
  battingRuns?: number;
}

/** Total innings score = batting runs + all extras. */
export function calculateInningsTotal(input: InningsTotalInput): { total: number; extras: number } {
  const extras = calculateExtrasTotal(input);
  const total = (input.battingRuns ?? 0) + extras;
  return { total, extras };
}

// ─── Derived batting stats ────────────────────────────────────────────────────

export interface BattingEntryInput {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

export interface BattingEntryDerived {
  strikeRate: number | null;
  boundaryRuns: number;
  dotBalls: number | null;
}

export function calculateBattingEntryDerivedStats(
  entry: BattingEntryInput
): BattingEntryDerived {
  return {
    strikeRate: calculateStrikeRate(entry.runs, entry.balls),
    boundaryRuns: entry.fours * 4 + entry.sixes * 6,
    dotBalls: null, // requires ball-by-ball data
  };
}

// ─── Derived bowling stats ────────────────────────────────────────────────────

export interface BowlingEntryInput {
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
}

export interface BowlingEntryDerived {
  oversText: string;
  economyRate: number | null;
}

export function calculateBowlingEntryDerivedStats(
  entry: BowlingEntryInput
): BowlingEntryDerived {
  return {
    oversText: ballsToOversText(entry.ballsBowled),
    economyRate: calculateEconomyRate(entry.runsConceded, entry.ballsBowled),
  };
}

// ─── Scorecard consistency checks ────────────────────────────────────────────

export interface ScorecardConsistencyWarning {
  type: string;
  message: string;
}

export interface ScorecardForValidation {
  inningsTotalRuns: number;
  extrasTotal: number;
  battingRunsSum: number;
  wicketsLost: number;
  ballsBowled: number;
  bowlingBallsSum: number;
  bowlingWicketsSum: number;
}

export function validateScorecardConsistency(
  scorecard: ScorecardForValidation
): ScorecardConsistencyWarning[] {
  const warnings: ScorecardConsistencyWarning[] = [];

  // Batting + extras should equal innings total
  const computedTotal = scorecard.battingRunsSum + scorecard.extrasTotal;
  if (scorecard.inningsTotalRuns > 0 && Math.abs(computedTotal - scorecard.inningsTotalRuns) > 0) {
    warnings.push({
      type: "total_mismatch",
      message: `Innings total ${scorecard.inningsTotalRuns} does not match batting runs (${scorecard.battingRunsSum}) + extras (${scorecard.extrasTotal}) = ${computedTotal}`,
    });
  }

  // Bowling wickets ≤ wickets lost
  if (scorecard.bowlingWicketsSum > scorecard.wicketsLost) {
    warnings.push({
      type: "bowling_wickets_exceed_wickets_lost",
      message: `Bowling wickets total (${scorecard.bowlingWicketsSum}) exceeds innings wickets lost (${scorecard.wicketsLost})`,
    });
  }

  // Wickets cannot exceed 10
  if (scorecard.wicketsLost > 10) {
    warnings.push({
      type: "wickets_exceed_ten",
      message: `Wickets lost (${scorecard.wicketsLost}) cannot exceed 10`,
    });
  }

  // Bowling balls should roughly match innings balls (allowing for wides/no-balls)
  if (scorecard.ballsBowled > 0 && scorecard.bowlingBallsSum > 0) {
    const diff = Math.abs(scorecard.ballsBowled - scorecard.bowlingBallsSum);
    if (diff > 6) {
      warnings.push({
        type: "bowling_balls_mismatch",
        message: `Bowling balls total (${scorecard.bowlingBallsSum}) differs from innings balls bowled (${scorecard.ballsBowled}) by ${diff}`,
      });
    }
  }

  return warnings;
}

// ─── Match result determination ───────────────────────────────────────────────

export interface InningsForResult {
  battingTeamId: string;
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  allOut: boolean;
  declared: boolean;
  forfeited: boolean;
  inningsStatus: string;
}

export interface MatchResultInput {
  homeTeamId: string;
  awayTeamId: string;
  innings: InningsForResult[];
  scheduledOvers: number;
  abandoned?: boolean;
}

export interface MatchResultOutput {
  resultType: string;
  winnerTeamId: string | null;
  loserTeamId: string | null;
  marginRuns: number | null;
  marginWickets: number | null;
  resultSummary: string | null;
}

export function determineMatchResult(input: MatchResultInput): MatchResultOutput {
  const { homeTeamId, innings, abandoned } = input;

  if (abandoned) {
    return {
      resultType: "abandoned",
      winnerTeamId: null,
      loserTeamId: null,
      marginRuns: null,
      marginWickets: null,
      resultSummary: "Match abandoned",
    };
  }

  // Need at least 2 innings for a result determination
  const completedInnings = innings.filter(
    (i) => i.inningsStatus === "completed" || i.allOut || i.declared
  );

  if (completedInnings.length < 2) {
    return {
      resultType: "unknown",
      winnerTeamId: null,
      loserTeamId: null,
      marginRuns: null,
      marginWickets: null,
      resultSummary: null,
    };
  }

  // Simple 2-innings limited-overs match determination
  const innings1 = completedInnings[0];
  const innings2 = completedInnings[1];

  if (!innings1 || !innings2) {
    return {
      resultType: "unknown",
      winnerTeamId: null,
      loserTeamId: null,
      marginRuns: null,
      marginWickets: null,
      resultSummary: null,
    };
  }

  const team1 = innings1.battingTeamId;
  const team2 = innings2.battingTeamId;
  const runs1 = innings1.totalRuns;
  const runs2 = innings2.totalRuns;

  if (runs1 === runs2) {
    return {
      resultType: "tie",
      winnerTeamId: null,
      loserTeamId: null,
      marginRuns: 0,
      marginWickets: null,
      resultSummary: "Match tied",
    };
  }

  if (runs1 > runs2) {
    const margin = runs1 - runs2;
    const winnerId = team1;
    const loserId = team2;
    const resultType = winnerId === homeTeamId ? "home_win" : "away_win";
    return {
      resultType,
      winnerTeamId: winnerId,
      loserTeamId: loserId,
      marginRuns: margin,
      marginWickets: null,
      resultSummary: `Won by ${margin} run${margin !== 1 ? "s" : ""}`,
    };
  }

  // Team 2 won chasing
  const margin = 10 - innings2.wicketsLost;
  const winnerId = team2;
  const loserId = team1;
  const resultType = winnerId === homeTeamId ? "home_win" : "away_win";
  return {
    resultType,
    winnerTeamId: winnerId,
    loserTeamId: loserId,
    marginRuns: null,
    marginWickets: margin,
    resultSummary: `Won by ${margin} wicket${margin !== 1 ? "s" : ""}`,
  };
}
