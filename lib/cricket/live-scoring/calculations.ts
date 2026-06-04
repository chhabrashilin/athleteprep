/**
 * lib/cricket/live-scoring/calculations.ts
 * Pure functions for ball-by-ball live scoring.
 * No side effects, no database access — fully testable.
 */

import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtraType =
  | "wide"
  | "no_ball"
  | "bye"
  | "leg_bye"
  | "penalty"
  | "no_ball_bye"
  | "no_ball_leg_bye";

export type WicketType =
  | "bowled"
  | "caught"
  | "caught_behind"
  | "lbw"
  | "run_out"
  | "stumped"
  | "hit_wicket"
  | "retired_hurt"
  | "retired_out"
  | "obstructing_field"
  | "hit_ball_twice"
  | "timed_out"
  | "absent_hurt"
  | "other";

export interface BallEventInput {
  runsBatter: number;
  runsExtras: number;
  extraType?: ExtraType | null;
  wicketType?: WicketType | null;
  playerOutId?: string | null;
  strikerId?: string | null;
  nonStrikerId?: string | null;
  bowlerId?: string | null;
  isBoundaryFour?: boolean;
  isBoundarySix?: boolean;
  commentary?: string | null;
  shotType?: string | null;
  fieldingPosition?: string | null;
}

export interface InningsState {
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  extrasTotal: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penaltyRuns: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
}

export interface BallState {
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  oversText: string;
  extrasTotal: number;
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penaltyRuns: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  currentOverNumber: number;
  currentBallInOver: number;
  isOverComplete: boolean;
  lastEventSummary: string;
}

export interface OverSummary {
  overNumber: number;
  runsInOver: number;
  wicketsInOver: number;
  notation: string[];
  oversText: string;
}

// ─── 1. isLegalDelivery ───────────────────────────────────────────────────────

/** Returns true if this delivery counts as a legal ball towards the over. */
export function isLegalDelivery(event: Pick<BallEventInput, "extraType">): boolean {
  const t = event.extraType;
  if (t === "wide") return false;
  if (t === "no_ball") return false;
  if (t === "no_ball_bye") return false;
  if (t === "no_ball_leg_bye") return false;
  return true;
}

// ─── 2. calculateRunsTotal ────────────────────────────────────────────────────

/** Total runs off the delivery = batter runs + extras. */
export function calculateRunsTotal(event: Pick<BallEventInput, "runsBatter" | "runsExtras">): number {
  return (event.runsBatter ?? 0) + (event.runsExtras ?? 0);
}

// ─── 3. shouldRotateStrike ────────────────────────────────────────────────────

export interface RotateStrikeResult {
  rotate: boolean;
  reason: string;
}

/**
 * Determines whether strike should rotate after this delivery.
 * Rules:
 * - End of legal over always rotates (handled by caller passing isEndOfOver).
 * - Odd batter runs rotate for normal deliveries.
 * - Wide: runs from wide don't rotate (ball not faced by batter).
 * - No-ball: batter runs still count for rotation; extra run from no-ball doesn't.
 * - Bye/Leg-bye: batter didn't score, but runs are odd-total, rotate by run count.
 * - Wicket: don't auto-rotate (new batter comes in).
 */
export function shouldRotateStrike(
  event: Pick<BallEventInput, "runsBatter" | "runsExtras" | "extraType" | "wicketType">,
  isEndOfOver: boolean
): RotateStrikeResult {
  if (event.wicketType) {
    if (isEndOfOver) return { rotate: true, reason: "end_of_over" };
    return { rotate: false, reason: "wicket_new_batter" };
  }

  if (isEndOfOver) {
    return { rotate: true, reason: "end_of_over" };
  }

  const t = event.extraType;

  // Wide: extras go to score but batter didn't face — don't rotate on runs, only on end of over
  if (t === "wide") {
    return { rotate: false, reason: "wide_no_rotation" };
  }

  // Batter runs always drive rotation for non-wide deliveries
  const batterRuns = event.runsBatter ?? 0;
  if (batterRuns % 2 === 1) {
    return { rotate: true, reason: "odd_batter_runs" };
  }

  // Bye/leg-bye: extras count as team runs; if total extras are odd, rotate
  if (t === "bye" || t === "leg_bye") {
    const extras = event.runsExtras ?? 0;
    if (extras % 2 === 1) return { rotate: true, reason: "odd_extras_bye" };
  }

  return { rotate: false, reason: "no_rotation" };
}

// ─── 4. getNextBallState ──────────────────────────────────────────────────────

/** Given the current innings state and a new event, compute next state. */
export function getNextBallState(
  current: InningsState,
  event: BallEventInput
): BallState {
  const legal = isLegalDelivery(event);
  const runsTotal = calculateRunsTotal(event);
  const isWicket = Boolean(event.wicketType);

  const newBallsBowled = legal ? current.ballsBowled + 1 : current.ballsBowled;
  const newTotalRuns = current.totalRuns + runsTotal;
  const newWicketsLost = isWicket ? current.wicketsLost + 1 : current.wicketsLost;

  // Extras breakdown
  const t = event.extraType;
  const extras = event.runsExtras ?? 0;
  const newWides = current.wides + (t === "wide" ? extras : 0);
  const newNoBalls = current.noBalls + (t === "no_ball" || t === "no_ball_bye" || t === "no_ball_leg_bye" ? 1 : 0);
  const newByes = current.byes + (t === "bye" || t === "no_ball_bye" ? extras : 0);
  const newLegByes = current.legByes + (t === "leg_bye" || t === "no_ball_leg_bye" ? extras : 0);
  const newPenalty = current.penaltyRuns + (t === "penalty" ? extras : 0);
  const newExtrasTotal = current.extrasTotal + extras + (t === "no_ball" ? 1 : 0);

  // Over/ball numbering
  const legalBallsInCurrentOver = newBallsBowled % 6;
  const currentOverNumber = Math.floor(newBallsBowled / 6);
  const isOverComplete = legal && legalBallsInCurrentOver === 0;
  const displayOverNumber = isOverComplete ? currentOverNumber - 1 : currentOverNumber;
  const displayBallInOver = isOverComplete ? 6 : legalBallsInCurrentOver;

  const isEndOfOver = isOverComplete;
  const { rotate } = shouldRotateStrike(event, isEndOfOver);

  // Strike rotation
  let newStriker = current.strikerId;
  let newNonStriker = current.nonStrikerId;

  if (isWicket) {
    // Non-striker stays; striker leaves (new batter will be set separately)
    newStriker = null;
  } else if (rotate) {
    newStriker = current.nonStrikerId;
    newNonStriker = current.strikerId;
  }

  const lastEventSummary = buildEventNotation(event);

  return {
    totalRuns: newTotalRuns,
    wicketsLost: newWicketsLost,
    ballsBowled: newBallsBowled,
    oversText: ballsToOversText(newBallsBowled),
    extrasTotal: newExtrasTotal,
    wides: newWides,
    noBalls: newNoBalls,
    byes: newByes,
    legByes: newLegByes,
    penaltyRuns: newPenalty,
    strikerId: newStriker,
    nonStrikerId: newNonStriker,
    bowlerId: current.bowlerId,
    currentOverNumber: displayOverNumber,
    currentBallInOver: displayBallInOver,
    isOverComplete,
    lastEventSummary,
  };
}

// ─── 5. calculateLiveRunRate ──────────────────────────────────────────────────

export function calculateLiveRunRate(totalRuns: number, ballsBowled: number): number | null {
  if (ballsBowled === 0) return null;
  return parseFloat(((totalRuns / ballsBowled) * 6).toFixed(2));
}

// ─── 6. calculateLiveRequiredRunRate ─────────────────────────────────────────

export function calculateLiveRequiredRunRate(
  target: number,
  currentRuns: number,
  ballsRemaining: number
): number | null {
  if (ballsRemaining <= 0) return null;
  const needed = target - currentRuns;
  if (needed <= 0) return 0;
  return parseFloat(((needed / ballsRemaining) * 6).toFixed(2));
}

// ─── 7. buildCommentaryLine ───────────────────────────────────────────────────

interface CommentaryContext {
  overNumber: number;
  ballInOver: number;
  bowlerName?: string | null;
  strikerName?: string | null;
  playerOutName?: string | null;
  fielderName?: string | null;
}

export function buildCommentaryLine(
  event: BallEventInput,
  ctx: CommentaryContext
): string {
  if (event.commentary) return event.commentary;

  const prefix = `${ctx.overNumber}.${ctx.ballInOver}`;
  const bowler = ctx.bowlerName ?? "Bowler";
  const batter = ctx.strikerName ?? "Batter";

  const t = event.extraType;
  const isWicket = Boolean(event.wicketType);

  if (isWicket) {
    const dismissal = formatWicketType(event.wicketType!);
    const out = ctx.playerOutName ?? batter;
    const fielder = ctx.fielderName ? ` by ${ctx.fielderName}` : "";
    return `${prefix} ${bowler} to ${batter}, OUT! ${out} ${dismissal}${fielder}.`;
  }

  if (t === "wide") {
    return `${prefix} ${bowler}, WIDE. +${event.runsExtras ?? 1} run${(event.runsExtras ?? 1) !== 1 ? "s" : ""}.`;
  }
  if (t === "no_ball" || t === "no_ball_bye" || t === "no_ball_leg_bye") {
    const runsStr = event.runsBatter > 0 ? `${event.runsBatter} run${event.runsBatter !== 1 ? "s" : ""}, ` : "";
    return `${prefix} ${bowler} to ${batter}, NO BALL. ${runsStr}+1 penalty.`;
  }
  if (t === "bye" || t === "leg_bye") {
    const extraLabel = t === "bye" ? "BYE" : "LEG BYE";
    return `${prefix} ${bowler} to ${batter}, ${extraLabel}. ${event.runsExtras ?? 0} run${(event.runsExtras ?? 0) !== 1 ? "s" : ""}.`;
  }

  if (event.runsBatter === 0) {
    return `${prefix} ${bowler} to ${batter}, dot ball.`;
  }
  if (event.isBoundarySix) {
    return `${prefix} ${bowler} to ${batter}, SIX!`;
  }
  if (event.isBoundaryFour) {
    return `${prefix} ${bowler} to ${batter}, FOUR!`;
  }
  return `${prefix} ${bowler} to ${batter}, ${event.runsBatter} run${event.runsBatter !== 1 ? "s" : ""}.`;
}

function formatWicketType(wt: WicketType): string {
  const map: Record<WicketType, string> = {
    bowled: "bowled",
    caught: "caught",
    caught_behind: "caught behind",
    lbw: "lbw",
    run_out: "run out",
    stumped: "stumped",
    hit_wicket: "hit wicket",
    retired_hurt: "retired hurt",
    retired_out: "retired out",
    obstructing_field: "obstructing the field",
    hit_ball_twice: "hit ball twice",
    timed_out: "timed out",
    absent_hurt: "absent hurt",
    other: "out",
  };
  return map[wt] ?? wt;
}

// ─── 8. buildEventNotation ───────────────────────────────────────────────────

/** Short notation for recent balls display: "0", "1", "4", "6", "W", "WD", "NB", "B", "LB" */
export function buildEventNotation(event: Pick<BallEventInput, "runsBatter" | "runsExtras" | "extraType" | "wicketType" | "isBoundaryFour" | "isBoundarySix">): string {
  const isWicket = Boolean(event.wicketType);
  const t = event.extraType;
  const r = event.runsBatter ?? 0;

  if (isWicket) {
    if (t === "no_ball") return `NB+W`;
    return r > 0 ? `${r}+W` : "W";
  }
  if (t === "wide") return `WD${(event.runsExtras ?? 1) > 1 ? `+${(event.runsExtras ?? 1) - 1}` : ""}`;
  if (t === "no_ball") return `NB${r > 0 ? `+${r}` : ""}`;
  if (t === "no_ball_bye") return `NB+B`;
  if (t === "no_ball_leg_bye") return `NB+LB`;
  if (t === "bye") return `B${event.runsExtras ?? 0}`;
  if (t === "leg_bye") return `LB${event.runsExtras ?? 0}`;
  if (t === "penalty") return `PEN${event.runsExtras ?? 0}`;

  if (event.isBoundarySix) return "6";
  if (event.isBoundaryFour) return "4";
  return `${r}`;
}

// ─── 9. summarizeOver ────────────────────────────────────────────────────────

export function summarizeOver(
  events: BallEventInput[],
  overNumber: number
): OverSummary {
  let runsInOver = 0;
  let wicketsInOver = 0;
  const notation: string[] = [];

  for (const e of events) {
    runsInOver += calculateRunsTotal(e);
    if (e.wicketType) wicketsInOver++;
    notation.push(buildEventNotation(e));
  }

  return {
    overNumber,
    runsInOver,
    wicketsInOver,
    notation,
    oversText: `${overNumber + 1} ov`,
  };
}

// ─── 10. rebuildInningsStateFromEvents ────────────────────────────────────────

/**
 * Given all non-deleted events in order, rebuild the innings state deterministically.
 * Critical: used after undo/correction so scoreboard stays correct.
 */
export function rebuildInningsStateFromEvents(
  events: BallEventInput[],
  initialState: InningsState
): InningsState {
  let state: InningsState = { ...initialState };

  for (const event of events) {
    const next = getNextBallState(state, event);
    state = {
      totalRuns: next.totalRuns,
      wicketsLost: next.wicketsLost,
      ballsBowled: next.ballsBowled,
      extrasTotal: next.extrasTotal,
      wides: next.wides,
      noBalls: next.noBalls,
      byes: next.byes,
      legByes: next.legByes,
      penaltyRuns: next.penaltyRuns,
      strikerId: next.strikerId,
      nonStrikerId: next.nonStrikerId,
      bowlerId: next.bowlerId,
    };
  }

  return state;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface BallEventValidationError {
  field: string;
  message: string;
}

/** Lightweight pre-save validation for ball events. Returns empty array if valid. */
export function validateBallEventInput(
  input: BallEventInput,
  context?: { wicketsAlreadyLost?: number; oversLimit?: number; ballsBowled?: number }
): BallEventValidationError[] {
  const errors: BallEventValidationError[] = [];

  if (input.runsBatter < 0) {
    errors.push({ field: "runsBatter", message: "Batter runs cannot be negative" });
  }
  if (input.runsBatter > 6) {
    errors.push({ field: "runsBatter", message: "Batter runs greater than 6 is unusual — verify" });
  }
  if (input.runsExtras < 0) {
    errors.push({ field: "runsExtras", message: "Extras cannot be negative" });
  }
  if (input.runsExtras > 10) {
    errors.push({ field: "runsExtras", message: "Extras greater than 10 is unusual — verify" });
  }

  // Wicket validation
  if (input.wicketType) {
    const needsPlayerOut: WicketType[] = [
      "bowled", "caught", "caught_behind", "lbw", "run_out", "stumped", "hit_wicket",
    ];
    if (needsPlayerOut.includes(input.wicketType) && !input.playerOutId) {
      errors.push({ field: "playerOutId", message: "Player out is required for this dismissal type" });
    }
  }

  // Extra type + runs
  const t = input.extraType;
  if (t === "wide" && input.runsBatter > 0) {
    errors.push({ field: "runsBatter", message: "Batter cannot score runs off a wide" });
  }
  if ((t === "bye" || t === "leg_bye") && input.runsExtras === 0) {
    errors.push({ field: "runsExtras", message: "Byes/leg-byes must have at least 1 extra run" });
  }

  // Innings capacity
  if (context?.wicketsAlreadyLost !== undefined && context.wicketsAlreadyLost >= 10) {
    errors.push({ field: "innings", message: "All 10 wickets have already fallen" });
  }
  if (
    context?.oversLimit !== undefined &&
    context?.ballsBowled !== undefined &&
    context.ballsBowled >= context.oversLimit * 6
  ) {
    errors.push({ field: "innings", message: "Innings overs limit already reached" });
  }

  return errors;
}
