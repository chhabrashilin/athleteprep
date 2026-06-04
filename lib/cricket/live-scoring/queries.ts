/**
 * lib/cricket/live-scoring/queries.ts
 * Read-only data access for live ball-by-ball scoring.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CricketBallEvent {
  id: string;
  matchId: string;
  inningsId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  overNumber: number;
  ballInOver: number;
  legalBallNumber: number | null;
  inningsBallNumber: number | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  runsBatter: number;
  runsExtras: number;
  runsTotal: number;
  extraType: string | null;
  wicketType: string | null;
  playerOutId: string | null;
  dismissedByPlayerId: string | null;
  fielderPlayerId: string | null;
  isLegalDelivery: boolean;
  isWicket: boolean;
  isBoundaryFour: boolean;
  isBoundarySix: boolean;
  isDotBall: boolean;
  shotType: string | null;
  lineLength: string | null;
  fieldingPosition: string | null;
  commentary: string | null;
  scorerUserId: string | null;
  correctionOfEventId: string | null;
  isCorrection: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CricketLiveMatchState {
  id: string;
  matchId: string;
  inningsId: string | null;
  battingTeamId: string | null;
  bowlingTeamId: string | null;
  totalRuns: number;
  wicketsLost: number;
  ballsBowled: number;
  oversText: string;
  extrasTotal: number;
  currentRunRate: number | null;
  requiredRunRate: number | null;
  targetRuns: number | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  lastEventId: string | null;
  status: string;
  version: number;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface CricketLiveScoringSession {
  id: string;
  matchId: string;
  scorerUserId: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  deviceLabel: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketBallEventCorrection {
  id: string;
  matchId: string;
  originalEventId: string | null;
  replacementEventId: string | null;
  correctionType: string;
  reason: string | null;
  correctedBy: string | null;
  createdAt: string;
}

export interface LiveScoringMatchData {
  match: Record<string, unknown>;
  innings: Record<string, unknown>[];
  squads: Record<string, unknown>[];
  liveState: CricketLiveMatchState | null;
  recentEvents: CricketBallEvent[];
  canScore: boolean;
  canManage: boolean;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToBallEvent(row: Record<string, unknown>): CricketBallEvent {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    inningsId: row.innings_id as string,
    battingTeamId: row.batting_team_id as string,
    bowlingTeamId: row.bowling_team_id as string,
    overNumber: (row.over_number as number) ?? 0,
    ballInOver: (row.ball_in_over as number) ?? 0,
    legalBallNumber: (row.legal_ball_number as number | null) ?? null,
    inningsBallNumber: (row.innings_ball_number as number | null) ?? null,
    strikerId: (row.striker_id as string | null) ?? null,
    nonStrikerId: (row.non_striker_id as string | null) ?? null,
    bowlerId: (row.bowler_id as string | null) ?? null,
    runsBatter: (row.runs_batter as number) ?? 0,
    runsExtras: (row.runs_extras as number) ?? 0,
    runsTotal: (row.runs_total as number) ?? 0,
    extraType: (row.extra_type as string | null) ?? null,
    wicketType: (row.wicket_type as string | null) ?? null,
    playerOutId: (row.player_out_id as string | null) ?? null,
    dismissedByPlayerId: (row.dismissed_by_player_id as string | null) ?? null,
    fielderPlayerId: (row.fielder_player_id as string | null) ?? null,
    isLegalDelivery: (row.is_legal_delivery as boolean) ?? true,
    isWicket: (row.is_wicket as boolean) ?? false,
    isBoundaryFour: (row.is_boundary_four as boolean) ?? false,
    isBoundarySix: (row.is_boundary_six as boolean) ?? false,
    isDotBall: (row.is_dot_ball as boolean) ?? false,
    shotType: (row.shot_type as string | null) ?? null,
    lineLength: (row.line_length as string | null) ?? null,
    fieldingPosition: (row.fielding_position as string | null) ?? null,
    commentary: (row.commentary as string | null) ?? null,
    scorerUserId: (row.scorer_user_id as string | null) ?? null,
    correctionOfEventId: (row.correction_of_event_id as string | null) ?? null,
    isCorrection: (row.is_correction as boolean) ?? false,
    isDeleted: (row.is_deleted as boolean) ?? false,
    deletedAt: (row.deleted_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToLiveState(row: Record<string, unknown>): CricketLiveMatchState {
  const balls = (row.balls_bowled as number) ?? 0;
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    inningsId: (row.innings_id as string | null) ?? null,
    battingTeamId: (row.batting_team_id as string | null) ?? null,
    bowlingTeamId: (row.bowling_team_id as string | null) ?? null,
    totalRuns: (row.total_runs as number) ?? 0,
    wicketsLost: (row.wickets_lost as number) ?? 0,
    ballsBowled: balls,
    oversText: (row.overs_text as string | null) ?? ballsToOversText(balls),
    extrasTotal: (row.extras_total as number) ?? 0,
    currentRunRate: (row.current_run_rate as number | null) ?? null,
    requiredRunRate: (row.required_run_rate as number | null) ?? null,
    targetRuns: (row.target_runs as number | null) ?? null,
    strikerId: (row.striker_id as string | null) ?? null,
    nonStrikerId: (row.non_striker_id as string | null) ?? null,
    bowlerId: (row.bowler_id as string | null) ?? null,
    lastEventId: (row.last_event_id as string | null) ?? null,
    status: (row.status as string) ?? "not_started",
    version: (row.version as number) ?? 0,
    updatedBy: (row.updated_by as string | null) ?? null,
    updatedAt: row.updated_at as string,
    createdAt: row.created_at as string,
  };
}

function rowToSession(row: Record<string, unknown>): CricketLiveScoringSession {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    scorerUserId: (row.scorer_user_id as string | null) ?? null,
    status: (row.status as string) ?? "active",
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string | null) ?? null,
    deviceLabel: (row.device_label as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToCorrection(row: Record<string, unknown>): CricketBallEventCorrection {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    originalEventId: (row.original_event_id as string | null) ?? null,
    replacementEventId: (row.replacement_event_id as string | null) ?? null,
    correctionType: row.correction_type as string,
    reason: (row.reason as string | null) ?? null,
    correctedBy: (row.corrected_by as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketBallEvents(
  matchId: string,
  inningsId?: string
): Promise<CricketBallEvent[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let q = supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (inningsId) q = q.eq("innings_id", inningsId);

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToBallEvent);
}

export async function getRecentCricketBallEvents(
  matchId: string,
  limit = 24
): Promise<CricketBallEvent[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToBallEvent).reverse();
}

export async function getLiveMatchState(matchId: string): Promise<CricketLiveMatchState | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_live_match_state")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToLiveState(data as Record<string, unknown>);
}

export async function getLiveScoringSessions(matchId: string): Promise<CricketLiveScoringSession[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_live_scoring_sessions")
    .select("*")
    .eq("match_id", matchId)
    .order("started_at", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToSession);
}

export async function getOverSummaryEvents(
  matchId: string,
  inningsId: string,
  overNumber: number
): Promise<CricketBallEvent[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("innings_id", inningsId)
    .eq("over_number", overNumber)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToBallEvent);
}

export async function getCorrectionHistory(matchId: string): Promise<CricketBallEventCorrection[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_ball_event_corrections")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToCorrection);
}

export async function userCanScoreLiveMatch(userId: string, matchId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .rpc("user_can_score_cricket_match", { _match_id: matchId, _user_id: userId });

  if (error) return false;
  return Boolean(data);
}

export async function userCanManageLiveMatch(userId: string, matchId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .rpc("user_can_manage_cricket_match", { _match_id: matchId, _user_id: userId });

  if (error) return false;
  return Boolean(data);
}
