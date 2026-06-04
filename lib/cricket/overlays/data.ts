/**
 * lib/cricket/overlays/data.ts
 * Pure functions that transform match/live scoring/scorecard data into
 * overlay-safe view models.  No Supabase, no secrets, no side effects.
 */

import type {
  ScorebugOverlayData,
  LowerThirdData,
  TossOverlayData,
  InningsBreakOverlayData,
  ResultOverlayData,
  FullScorecardOverlayData,
  OverlayStatus,
  StreamStatus,
} from "@/lib/cricket/types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function safeRound(n: number | null | undefined, places = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return n.toFixed(places);
}

function formatRunsBalls(runs: number | null, balls: number | null): string | null {
  if (runs == null) return null;
  return balls != null ? `${runs}(${balls})` : `${runs}`;
}

// ─── Input shape definitions (kept narrow — only what overlay needs) ──────────

export interface LiveStateInput {
  totalRuns: number;
  wicketsLost: number;
  oversText: string;
  currentRunRate: number | null;
  requiredRunRate: number | null;
  targetRuns: number | null;
  status: string;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
}

export interface PlayerRef {
  id: string;
  name: string;
  shortName?: string | null;
}

export interface BallNotation {
  notation: string;
  isWicket: boolean;
  isBoundaryFour: boolean;
  isBoundarySix: boolean;
  isLegal: boolean;
}

export interface ScorebugInput {
  matchTitle: string;
  leagueName: string | null;
  homeTeamName: string;
  homeTeamShortName?: string | null;
  awayTeamName: string;
  awayTeamShortName?: string | null;
  battingTeamId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  liveState: LiveStateInput | null;
  striker: PlayerRef | null;
  nonStriker: PlayerRef | null;
  bowler: PlayerRef | null;
  strikerRuns: number | null;
  strikerBalls: number | null;
  nonStrikerRuns: number | null;
  nonStrikerBalls: number | null;
  bowlerWickets: number | null;
  bowlerRuns: number | null;
  bowlerOvers: string | null;
  lastBalls: BallNotation[];
}

export interface TossInput {
  tossWonByTeamId: string | null;
  tossDecision: string | null;
  homeTeamName: string;
  homeTeamId: string;
  awayTeamName: string;
  awayTeamId: string;
  venueName: string | null;
  matchTitle: string;
}

export interface BattingEntryInput {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number | null;
  howOut: string;
}

export interface BowlingEntryInput {
  name: string;
  oversBowled: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number | null;
}

export interface ScorecardInput {
  battingTeamName: string;
  bowlingTeamName: string;
  batting: BattingEntryInput[];
  bowling: BowlingEntryInput[];
  extrasTotal: number;
  totalRuns: number;
  totalWickets: number;
  oversText: string;
}

export interface InningsBreakInput {
  firstInningsTeam: string;
  firstInningsTotal: number;
  firstInningsWickets: number;
  firstInningsOvers: string;
  targetRuns: number;
  oversLimit: number | null;
  topBatterName: string | null;
  topBatterRuns: number | null;
  topBatterBalls: number | null;
  topBowlerName: string | null;
  topBowlerWickets: number | null;
  topBowlerRuns: number | null;
  topBowlerOvers: string | null;
}

export interface ResultInput {
  winnerTeamName: string;
  winMargin: number | null;
  winMarginType: "runs" | "wickets" | "tie" | "super_over" | "no_result" | null;
  playerOfMatchName: string | null;
  team1Name: string;
  team1Total: number;
  team1Wickets: number;
  team1Overs: string;
  team2Name: string;
  team2Total: number;
  team2Wickets: number;
  team2Overs: string;
  matchTitle: string;
}

export interface PartnershipInput {
  batter1Name: string;
  batter2Name: string;
  partnershipRuns: number;
  partnershipBalls: number;
  wicketNumber: number;
}

export interface UpcomingBatterInput {
  battingOrder: Array<{ name: string; position: number; isOut: boolean }>;
  currentWickets: number;
}

export interface MatchStreamRef {
  status: StreamStatus;
}

export interface MatchRef {
  status: string;
  liveState?: LiveStateInput | null;
}

// ─── 1. buildScorebugOverlayData ─────────────────────────────────────────────

export function buildScorebugOverlayData(input: ScorebugInput): ScorebugOverlayData {
  const {
    matchTitle, leagueName, liveState,
    homeTeamName, homeTeamShortName, homeTeamId,
    awayTeamName, awayTeamShortName,
    battingTeamId,
    striker, nonStriker, bowler,
    strikerRuns, strikerBalls, nonStrikerRuns, nonStrikerBalls,
    bowlerWickets, bowlerRuns, bowlerOvers,
    lastBalls,
  } = input;

  const battingIsHome = battingTeamId === homeTeamId;
  const battingShort = battingIsHome
    ? (homeTeamShortName ?? homeTeamName.slice(0, 3).toUpperCase())
    : (awayTeamShortName ?? awayTeamName.slice(0, 3).toUpperCase());
  const bowlingShort = battingIsHome
    ? (awayTeamShortName ?? awayTeamName.slice(0, 3).toUpperCase())
    : (homeTeamShortName ?? homeTeamName.slice(0, 3).toUpperCase());

  const scoreText = liveState
    ? `${liveState.totalRuns}/${liveState.wicketsLost}`
    : "0/0";

  const oversText = liveState?.oversText ?? "0.0";

  const runRate = liveState?.currentRunRate != null
    ? safeRound(liveState.currentRunRate)
    : null;

  const targetText = liveState?.targetRuns != null
    ? `Need ${liveState.targetRuns - (liveState.totalRuns)} off ${liveState.requiredRunRate != null ? `(RR: ${safeRound(liveState.requiredRunRate)})` : ""}`
    : null;

  const statusLabel = liveState?.status
    ? liveState.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not Started";

  const bowlerFigures = bowler && bowlerWickets != null && bowlerRuns != null
    ? `${bowlerWickets}/${bowlerRuns}${bowlerOvers ? ` (${bowlerOvers})` : ""}`
    : null;

  const lastBallNotations = lastBalls.slice(-6).map((b) => b.notation);

  return {
    matchTitle,
    leagueName,
    battingTeamShortName: battingShort,
    bowlingTeamShortName: bowlingShort,
    scoreText,
    oversText,
    runRate,
    targetText,
    strikerName: striker?.name ?? null,
    strikerRunsBalls: formatRunsBalls(strikerRuns, strikerBalls),
    nonStrikerName: nonStriker?.name ?? null,
    nonStrikerRunsBalls: formatRunsBalls(nonStrikerRuns, nonStrikerBalls),
    bowlerName: bowler?.name ?? null,
    bowlerFigures,
    lastBalls: lastBallNotations,
    statusLabel,
  };
}

// ─── 2. buildLowerThirdData ───────────────────────────────────────────────────

export function buildLowerThirdData(input: {
  playerName: string;
  role?: string | null;
  statLine?: string | null;
  teamName?: string | null;
  imageUrl?: string | null;
}): LowerThirdData {
  return {
    playerName: input.playerName,
    role: input.role ?? null,
    statLine: input.statLine ?? null,
    teamName: input.teamName ?? null,
    imageUrl: input.imageUrl ?? null,
  };
}

// ─── 3. buildTossOverlayData ──────────────────────────────────────────────────

export function buildTossOverlayData(input: TossInput): TossOverlayData {
  const {
    tossWonByTeamId, tossDecision,
    homeTeamName, homeTeamId,
    awayTeamName, venueName, matchTitle,
  } = input;

  const tossWinner = tossWonByTeamId === homeTeamId ? homeTeamName : awayTeamName;
  const decision = tossDecision
    ? tossDecision.replace(/_/g, " ")
    : "elected to bat";

  return {
    tossWinner,
    decision,
    homeTeam: homeTeamName,
    awayTeam: input.awayTeamName,
    venue: venueName ?? null,
    matchTitle,
  };
}

// ─── 4. buildInningsBreakOverlayData ─────────────────────────────────────────

export function buildInningsBreakOverlayData(input: InningsBreakInput): InningsBreakOverlayData {
  const {
    firstInningsTeam, firstInningsTotal, firstInningsWickets,
    targetRuns, oversLimit,
    topBatterName, topBatterRuns, topBatterBalls,
    topBowlerName, topBowlerWickets, topBowlerRuns, topBowlerOvers,
  } = input;

  const needed = targetRuns - firstInningsTotal;
  const oversStr = oversLimit != null ? `${oversLimit} overs` : "remaining overs";
  const chaseRequirement = `${needed} runs in ${oversStr}`;

  return {
    battingTeam: firstInningsTeam,
    score: `${firstInningsTotal}/${firstInningsWickets}`,
    target: targetRuns,
    topBatter: topBatterName ?? null,
    topBatterScore: formatRunsBalls(topBatterRuns, topBatterBalls),
    topBowler: topBowlerName ?? null,
    topBowlerFigures:
      topBowlerWickets != null && topBowlerRuns != null
        ? `${topBowlerWickets}/${topBowlerRuns}${topBowlerOvers ? ` (${topBowlerOvers})` : ""}`
        : null,
    chaseRequirement,
    oversToChase: oversLimit != null ? `${oversLimit}` : null,
  };
}

// ─── 5. buildResultOverlayData ────────────────────────────────────────────────

export function buildResultOverlayData(input: ResultInput): ResultOverlayData {
  const {
    winnerTeamName, winMargin, winMarginType,
    playerOfMatchName,
    team1Name, team1Total, team1Wickets, team1Overs,
    team2Name, team2Total, team2Wickets, team2Overs,
    matchTitle,
  } = input;

  let margin = "Match completed";
  if (winMarginType === "runs" && winMargin != null) {
    margin = `${winnerTeamName} won by ${winMargin} run${winMargin === 1 ? "" : "s"}`;
  } else if (winMarginType === "wickets" && winMargin != null) {
    margin = `${winnerTeamName} won by ${winMargin} wicket${winMargin === 1 ? "" : "s"}`;
  } else if (winMarginType === "tie") {
    margin = "Match tied";
  } else if (winMarginType === "super_over") {
    margin = `${winnerTeamName} won (Super Over)`;
  } else if (winMarginType === "no_result") {
    margin = "No result";
  }

  return {
    winner: winnerTeamName,
    margin,
    playerOfMatch: playerOfMatchName ?? null,
    team1Score: `${team1Name}: ${team1Total}/${team1Wickets} (${team1Overs})`,
    team2Score: `${team2Name}: ${team2Total}/${team2Wickets} (${team2Overs})`,
    matchTitle,
  };
}

// ─── 6. buildFullScorecardOverlayData ────────────────────────────────────────

export function buildFullScorecardOverlayData(input: ScorecardInput): FullScorecardOverlayData {
  return {
    battingTeam: input.battingTeamName,
    bowlingTeam: input.bowlingTeamName,
    batting: input.batting.map((b) => ({
      name: b.name,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      sr: b.strikeRate != null ? safeRound(b.strikeRate) : "—",
      howOut: b.howOut,
    })),
    bowling: input.bowling.map((b) => ({
      name: b.name,
      overs: b.oversBowled,
      maidens: b.maidens,
      runs: b.runsConceded,
      wickets: b.wickets,
      economy: b.economy != null ? safeRound(b.economy) : "—",
    })),
    extras: input.extrasTotal,
    total: `${input.totalRuns}/${input.totalWickets} (${input.oversText})`,
  };
}

// ─── 7. buildUpcomingBatterOverlayData ───────────────────────────────────────

export function buildUpcomingBatterOverlayData(input: UpcomingBatterInput): Array<{
  name: string;
  position: number;
  note: string;
}> {
  return input.battingOrder
    .filter((b) => !b.isOut && b.position > input.currentWickets + 2)
    .slice(0, 3)
    .map((b) => ({
      name: b.name,
      position: b.position,
      note: "Suggested — not guaranteed",
    }));
}

// ─── 8. buildPartnershipOverlayData ──────────────────────────────────────────

export function buildPartnershipOverlayData(input: PartnershipInput): {
  batter1: string;
  batter2: string;
  runs: number;
  balls: number;
  runRate: string;
  wicketLabel: string;
} {
  const runRate = input.partnershipBalls > 0
    ? safeRound((input.partnershipRuns / input.partnershipBalls) * 6)
    : "—";
  return {
    batter1: input.batter1Name,
    batter2: input.batter2Name,
    runs: input.partnershipRuns,
    balls: input.partnershipBalls,
    runRate,
    wicketLabel: `${input.wicketNumber}${ordinalSuffix(input.wicketNumber)} wicket`,
  };
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

// ─── 9. sanitizeOverlayData ───────────────────────────────────────────────────

const PRIVATE_FIELD_KEYS = new Set([
  "email", "phone", "mobile", "contact", "stream_key", "streamKey",
  "stream_key_encrypted", "streamKeyEncrypted", "token_hash", "tokenHash",
  "password", "secret", "service_role_key", "serviceRoleKey",
  "internal_notes", "internalNotes", "private_notes", "privateNotes",
]);

export function sanitizeOverlayData<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (PRIVATE_FIELD_KEYS.has(key)) {
      delete (result as Record<string, unknown>)[key];
    } else if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      (result as Record<string, unknown>)[key] = sanitizeOverlayData(
        result[key] as Record<string, unknown>
      );
    }
  }
  return result;
}

// ─── 10. getOverlayStatus ─────────────────────────────────────────────────────

export function getOverlayStatus(
  matchStatus: string | null | undefined,
  streamStatus: StreamStatus | null | undefined,
  _liveStatus: string | null | undefined
): OverlayStatus {
  if (!matchStatus) return "not_configured";
  if (matchStatus === "completed" || matchStatus === "abandoned") return "completed";
  if (streamStatus === "failed") return "error";
  if (!streamStatus || streamStatus === "not_configured") return "not_configured";
  if (streamStatus === "ended") return "completed";
  if (matchStatus === "innings_break") return "innings_break";
  if (streamStatus === "live" || matchStatus === "live") return "live";
  if (streamStatus === "ready" || streamStatus === "scheduled") return "ready";
  return "not_configured";
}
