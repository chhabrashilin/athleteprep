"use server";

/**
 * lib/cricket/live-scoring/actions.ts
 * Server actions for ball-by-ball live scoring.
 * All mutations persist to Supabase — no fake updates.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/server";
import {
  startLiveScoringSchema,
  ballEventSchema,
  correctionSchema,
  type StartLiveScoringInput,
  type BallEventInput,
} from "@/lib/cricket/validation/live-scoring";
import {
  isLegalDelivery,
  calculateRunsTotal,
  getNextBallState,
  calculateLiveRunRate,
  calculateLiveRequiredRunRate,
  buildCommentaryLine,
  buildEventNotation,
  rebuildInningsStateFromEvents,
  validateBallEventInput,
  type InningsState,
  type BallEventInput as CalcBallEventInput,
} from "./calculations";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";
import type { CricketLiveMatchState, CricketBallEvent } from "./queries";

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function liveStateFromRow(row: Record<string, unknown>): CricketLiveMatchState {
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

async function requireScorer(matchId: string): Promise<{ userId: string } | { error: string }> {
  const user = await getServerUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Database unavailable" };

  const { data } = await supabase.rpc("user_can_score_cricket_match", {
    _match_id: matchId,
    _user_id: user.id,
  });

  if (!data) return { error: "You do not have permission to score this match" };
  return { userId: user.id };
}

// ─── 1. startLiveScoring ─────────────────────────────────────────────────────

export async function startLiveScoring(
  input: StartLiveScoringInput
): Promise<ActionResult<CricketLiveMatchState>> {
  const parsed = startLiveScoringSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = await requireScorer(parsed.data.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { match_id, innings_id, batting_team_id, bowling_team_id, striker_id, non_striker_id, bowler_id } = parsed.data;

  // Fetch match to verify it exists and check existing status
  const { data: matchRow, error: matchErr } = await supabase
    .from("cricket_matches")
    .select("id, live_scoring_status, scorecard_status, overs_per_innings, innings_number")
    .eq("id", match_id)
    .maybeSingle();

  if (matchErr || !matchRow) return { success: false, error: "Match not found" };

  const existingStatus = (matchRow as Record<string, unknown>).live_scoring_status as string;
  if (existingStatus === "completed" || existingStatus === "locked") {
    return { success: false, error: "Match live scoring is already completed or locked" };
  }

  // Create or find innings
  let activeInningsId = innings_id;
  if (!activeInningsId) {
    // Find the first not-started/in-progress innings for batting team
    const { data: existingInnings } = await supabase
      .from("cricket_innings")
      .select("id, innings_status")
      .eq("match_id", match_id)
      .eq("batting_team_id", batting_team_id)
      .order("innings_number", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingInnings && (existingInnings as Record<string, unknown>).innings_status !== "completed") {
      activeInningsId = (existingInnings as Record<string, unknown>).id as string;
    } else {
      // Count existing innings
      const { data: allInnings } = await supabase
        .from("cricket_innings")
        .select("innings_number")
        .eq("match_id", match_id)
        .order("innings_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextInningsNum = allInnings
        ? ((allInnings as Record<string, unknown>).innings_number as number) + 1
        : 1;

      const { data: newInnings, error: inningsErr } = await supabase
        .from("cricket_innings")
        .insert({
          match_id,
          innings_number: nextInningsNum,
          batting_team_id,
          bowling_team_id,
          innings_status: "in_progress",
          started_at: new Date().toISOString(),
          created_by: auth.userId,
        })
        .select("id")
        .single();

      if (inningsErr || !newInnings) return { success: false, error: "Failed to create innings" };
      activeInningsId = (newInnings as Record<string, unknown>).id as string;
    }
  } else {
    // Mark existing innings as in_progress
    await supabase
      .from("cricket_innings")
      .update({ innings_status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", activeInningsId)
      .eq("innings_status", "not_started");
  }

  // Upsert live match state
  const { data: stateRow, error: stateErr } = await supabase
    .from("cricket_live_match_state")
    .upsert({
      match_id,
      innings_id: activeInningsId,
      batting_team_id,
      bowling_team_id,
      striker_id,
      non_striker_id,
      bowler_id,
      status: "live",
      total_runs: 0,
      wickets_lost: 0,
      balls_bowled: 0,
      overs_text: "0.0",
      extras_total: 0,
      updated_by: auth.userId,
    }, { onConflict: "match_id" })
    .select()
    .single();

  if (stateErr || !stateRow) return { success: false, error: "Failed to create live state" };

  // Update match
  await supabase
    .from("cricket_matches")
    .update({
      live_scoring_status: "live",
      match_status: "live",
      scoring_mode: "ball_by_ball",
      scorecard_status: "in_progress",
      current_innings_id: activeInningsId,
      current_batter_id: striker_id,
      current_non_striker_id: non_striker_id,
      current_bowler_id: bowler_id,
      live_started_at: new Date().toISOString(),
      last_scored_at: new Date().toISOString(),
    })
    .eq("id", match_id);

  // Create scoring session
  await supabase
    .from("cricket_live_scoring_sessions")
    .insert({
      match_id,
      scorer_user_id: auth.userId,
      status: "active",
      started_at: new Date().toISOString(),
    });

  return { success: true, data: liveStateFromRow(stateRow as Record<string, unknown>) };
}

// ─── 2. pauseLiveScoring ─────────────────────────────────────────────────────

export async function pauseLiveScoring(
  matchId: string
): Promise<ActionResult> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  await supabase
    .from("cricket_matches")
    .update({ live_scoring_status: "paused" })
    .eq("id", matchId);

  await supabase
    .from("cricket_live_match_state")
    .update({ status: "paused", updated_by: auth.userId })
    .eq("match_id", matchId);

  // End active session
  await supabase
    .from("cricket_live_scoring_sessions")
    .update({ status: "paused", ended_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .eq("status", "active");

  return { success: true };
}

// ─── 3. resumeLiveScoring ────────────────────────────────────────────────────

export async function resumeLiveScoring(
  matchId: string
): Promise<ActionResult> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  await supabase
    .from("cricket_matches")
    .update({ live_scoring_status: "live" })
    .eq("id", matchId)
    .eq("live_scoring_status", "paused");

  await supabase
    .from("cricket_live_match_state")
    .update({ status: "live", updated_by: auth.userId })
    .eq("match_id", matchId);

  // Create new session
  await supabase
    .from("cricket_live_scoring_sessions")
    .insert({
      match_id: matchId,
      scorer_user_id: auth.userId,
      status: "active",
      started_at: new Date().toISOString(),
    });

  return { success: true };
}

// ─── 4. endInnings ───────────────────────────────────────────────────────────

export async function endInnings(
  matchId: string,
  inningsId: string,
  reason?: string
): Promise<ActionResult> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const now = new Date().toISOString();

  await supabase
    .from("cricket_innings")
    .update({
      innings_status: "completed",
      ended_at: now,
      notes: reason ?? null,
    })
    .eq("id", inningsId);

  // Count completed innings to determine if match is done
  const { data: allInnings } = await supabase
    .from("cricket_innings")
    .select("innings_status")
    .eq("match_id", matchId);

  const completedCount = (allInnings ?? []).filter(
    (i) => (i as Record<string, unknown>).innings_status === "completed"
  ).length;

  const nextStatus = completedCount >= 2 ? "completed" : "innings_break";

  await supabase
    .from("cricket_matches")
    .update({ live_scoring_status: nextStatus })
    .eq("id", matchId);

  await supabase
    .from("cricket_live_match_state")
    .update({ status: nextStatus, updated_by: auth.userId })
    .eq("match_id", matchId);

  return { success: true, data: { nextStatus } };
}

// ─── 5. recordBallEvent ──────────────────────────────────────────────────────

export async function recordBallEvent(
  rawInput: BallEventInput
): Promise<ActionResult<{ event: CricketBallEvent; liveState: CricketLiveMatchState }>> {
  const parsed = ballEventSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid ball event" };
  }

  const input = parsed.data;
  const auth = await requireScorer(input.match_id);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Fetch current live state
  const { data: stateRow, error: stateErr } = await supabase
    .from("cricket_live_match_state")
    .select("*")
    .eq("match_id", input.match_id)
    .maybeSingle();

  if (stateErr || !stateRow) return { success: false, error: "No live scoring session found. Start live scoring first." };

  const currentState = liveStateFromRow(stateRow as Record<string, unknown>);

  if (currentState.status !== "live") {
    return { success: false, error: `Cannot record ball — match is ${currentState.status}` };
  }

  // Build calc input
  const calcInput: CalcBallEventInput = {
    runsBatter: input.runs_batter,
    runsExtras: input.runs_extras,
    extraType: input.extra_type ?? undefined,
    wicketType: input.wicket_type ?? undefined,
    playerOutId: input.player_out_id ?? undefined,
    strikerId: input.striker_id,
    nonStrikerId: input.non_striker_id,
    bowlerId: input.bowler_id,
    isBoundaryFour: input.runs_batter === 4 && !input.extra_type,
    isBoundarySix: input.runs_batter === 6 && !input.extra_type,
    commentary: input.commentary ?? undefined,
    shotType: input.shot_type ?? undefined,
    fieldingPosition: input.fielding_position ?? undefined,
  };

  // Validate
  const valErrors = validateBallEventInput(calcInput, {
    wicketsAlreadyLost: currentState.wicketsLost,
  });
  const warnings = valErrors.filter((e) => !e.field.startsWith("innings")).map((e) => e.message);

  const currentInningsState: InningsState = {
    totalRuns: currentState.totalRuns,
    wicketsLost: currentState.wicketsLost,
    ballsBowled: currentState.ballsBowled,
    extrasTotal: currentState.extrasTotal,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penaltyRuns: 0,
    strikerId: currentState.strikerId,
    nonStrikerId: currentState.nonStrikerId,
    bowlerId: currentState.bowlerId,
  };

  const nextState = getNextBallState(currentInningsState, calcInput);
  const runsTotal = calculateRunsTotal(calcInput);
  const legal = isLegalDelivery(calcInput);
  const legalBallNum = legal ? nextState.ballsBowled : currentState.ballsBowled;

  // Build commentary
  const commentary = buildCommentaryLine(calcInput, {
    overNumber: input.over_number,
    ballInOver: input.ball_in_over,
  });

  const isFour = input.runs_batter === 4 && !input.extra_type;
  const isSix = input.runs_batter === 6 && !input.extra_type;
  const isDot = !input.wicket_type && runsTotal === 0;

  // Insert ball event
  const { data: eventRow, error: eventErr } = await supabase
    .from("cricket_ball_events")
    .insert({
      match_id: input.match_id,
      innings_id: input.innings_id,
      batting_team_id: currentState.battingTeamId!,
      bowling_team_id: currentState.bowlingTeamId!,
      over_number: input.over_number,
      ball_in_over: input.ball_in_over,
      legal_ball_number: legalBallNum,
      innings_ball_number: nextState.ballsBowled,
      striker_id: input.striker_id,
      non_striker_id: input.non_striker_id,
      bowler_id: input.bowler_id,
      runs_batter: input.runs_batter,
      runs_extras: input.runs_extras,
      runs_total: runsTotal,
      extra_type: input.extra_type ?? null,
      wicket_type: input.wicket_type ?? null,
      player_out_id: input.player_out_id ?? null,
      fielder_player_id: input.fielder_player_id ?? null,
      is_legal_delivery: legal,
      is_wicket: Boolean(input.wicket_type),
      is_boundary_four: isFour,
      is_boundary_six: isSix,
      is_dot_ball: isDot,
      shot_type: input.shot_type ?? null,
      fielding_position: input.fielding_position ?? null,
      wagon_zone: input.wagon_zone ?? null,
      bat_contact_type: input.bat_contact_type ?? null,
      commentary,
      scorer_user_id: auth.userId,
    })
    .select()
    .single();

  if (eventErr || !eventRow) {
    return { success: false, error: "Failed to record ball event" };
  }

  const event = eventRow as Record<string, unknown>;

  // Update live match state
  const newCrr = calculateLiveRunRate(nextState.totalRuns, nextState.ballsBowled);
  const newRrr = currentState.targetRuns
    ? calculateLiveRequiredRunRate(
        currentState.targetRuns,
        nextState.totalRuns,
        // Assume max innings balls from match overs_per_innings if available
        120 - nextState.ballsBowled
      )
    : null;

  const { data: updatedStateRow, error: stateUpdateErr } = await supabase
    .from("cricket_live_match_state")
    .update({
      total_runs: nextState.totalRuns,
      wickets_lost: nextState.wicketsLost,
      balls_bowled: nextState.ballsBowled,
      overs_text: nextState.oversText,
      extras_total: nextState.extrasTotal,
      striker_id: nextState.strikerId,
      non_striker_id: nextState.nonStrikerId,
      last_event_id: event.id as string,
      current_run_rate: newCrr,
      required_run_rate: newRrr,
      version: currentState.version + 1,
      updated_by: auth.userId,
    })
    .eq("match_id", input.match_id)
    .select()
    .single();

  if (stateUpdateErr || !updatedStateRow) {
    return { success: false, error: "Ball recorded but live state update failed", warnings };
  }

  // Update innings aggregate
  await supabase
    .from("cricket_innings")
    .update({
      total_runs: nextState.totalRuns,
      wickets_lost: nextState.wicketsLost,
      balls_bowled: nextState.ballsBowled,
      overs_text: nextState.oversText,
      extras_total: nextState.extrasTotal,
      run_rate: newCrr,
    })
    .eq("id", input.innings_id);

  // Update/create batting entry for striker
  await upsertBattingEntry(supabase, input, calcInput, runsTotal, event.id as string);

  // Update/create bowling entry for bowler
  await upsertBowlingEntry(supabase, input, calcInput, runsTotal, event.id as string);

  // If wicket — insert fall of wickets
  if (input.wicket_type && input.player_out_id) {
    await supabase
      .from("cricket_fall_of_wickets")
      .upsert({
        innings_id: input.innings_id,
        match_id: input.match_id,
        wicket_number: nextState.wicketsLost,
        team_score: nextState.totalRuns,
        balls_elapsed: nextState.ballsBowled,
        overs_text: nextState.oversText,
        player_out_id: input.player_out_id,
      }, { onConflict: "innings_id,wicket_number", ignoreDuplicates: true });
  }

  // Update match housekeeping
  await supabase
    .from("cricket_matches")
    .update({
      last_scored_at: new Date().toISOString(),
      current_batter_id: nextState.strikerId,
      current_non_striker_id: nextState.nonStrikerId,
    })
    .eq("id", input.match_id);

  // Map event row
  const mappedEvent: CricketBallEvent = {
    id: event.id as string,
    matchId: event.match_id as string,
    inningsId: event.innings_id as string,
    battingTeamId: event.batting_team_id as string,
    bowlingTeamId: event.bowling_team_id as string,
    overNumber: event.over_number as number,
    ballInOver: event.ball_in_over as number,
    legalBallNumber: (event.legal_ball_number as number | null) ?? null,
    inningsBallNumber: (event.innings_ball_number as number | null) ?? null,
    strikerId: (event.striker_id as string | null) ?? null,
    nonStrikerId: (event.non_striker_id as string | null) ?? null,
    bowlerId: (event.bowler_id as string | null) ?? null,
    runsBatter: event.runs_batter as number,
    runsExtras: event.runs_extras as number,
    runsTotal: event.runs_total as number,
    extraType: (event.extra_type as string | null) ?? null,
    wicketType: (event.wicket_type as string | null) ?? null,
    playerOutId: (event.player_out_id as string | null) ?? null,
    dismissedByPlayerId: (event.dismissed_by_player_id as string | null) ?? null,
    fielderPlayerId: (event.fielder_player_id as string | null) ?? null,
    isLegalDelivery: event.is_legal_delivery as boolean,
    isWicket: event.is_wicket as boolean,
    isBoundaryFour: event.is_boundary_four as boolean,
    isBoundarySix: event.is_boundary_six as boolean,
    isDotBall: event.is_dot_ball as boolean,
    shotType: (event.shot_type as string | null) ?? null,
    lineLength: (event.line_length as string | null) ?? null,
    fieldingPosition: (event.fielding_position as string | null) ?? null,
    commentary: (event.commentary as string | null) ?? null,
    scorerUserId: (event.scorer_user_id as string | null) ?? null,
    correctionOfEventId: null,
    isCorrection: false,
    isDeleted: false,
    deletedAt: null,
    metadata: {},
    createdAt: event.created_at as string,
    updatedAt: event.updated_at as string,
  };

  return {
    success: true,
    data: {
      event: mappedEvent,
      liveState: liveStateFromRow(updatedStateRow as Record<string, unknown>),
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ─── 6. undoLastBallEvent ────────────────────────────────────────────────────

export async function undoLastBallEvent(
  matchId: string,
  reason?: string
): Promise<ActionResult<CricketLiveMatchState>> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Find last non-deleted event
  const { data: lastEventRow } = await supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastEventRow) return { success: false, error: "No ball events to undo" };

  const lastEvent = lastEventRow as Record<string, unknown>;
  const inningsId = lastEvent.innings_id as string;

  // Soft-delete it
  await supabase
    .from("cricket_ball_events")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.userId,
    })
    .eq("id", lastEvent.id as string);

  // Record correction
  await supabase
    .from("cricket_ball_event_corrections")
    .insert({
      match_id: matchId,
      original_event_id: lastEvent.id as string,
      correction_type: "undo",
      reason: reason ?? null,
      corrected_by: auth.userId,
    });

  // Rebuild state
  return rebuildLiveScoreFromEvents(matchId, inningsId, auth.userId);
}

// ─── 7. correctBallEvent ─────────────────────────────────────────────────────

export async function correctBallEvent(
  rawInput: { event_id: string; correction_type: string; reason?: string | null; replacement_event?: BallEventInput | null }
): Promise<ActionResult<CricketLiveMatchState>> {
  const parsed = correctionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid correction input" };
  }

  const input = parsed.data;

  // Fetch original event to get matchId
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: origRow } = await supabase
    .from("cricket_ball_events")
    .select("match_id, innings_id")
    .eq("id", input.event_id)
    .maybeSingle();

  if (!origRow) return { success: false, error: "Original event not found" };

  const orig = origRow as Record<string, unknown>;
  const matchId = orig.match_id as string;
  const inningsId = orig.innings_id as string;

  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  // Soft-delete original
  await supabase
    .from("cricket_ball_events")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.userId,
    })
    .eq("id", input.event_id);

  let replacementEventId: string | null = null;

  // Insert replacement if provided
  if (input.replacement_event) {
    const rep = input.replacement_event;
    const calcInput: CalcBallEventInput = {
      runsBatter: rep.runs_batter,
      runsExtras: rep.runs_extras,
      extraType: rep.extra_type ?? undefined,
      wicketType: rep.wicket_type ?? undefined,
      playerOutId: rep.player_out_id ?? undefined,
      strikerId: rep.striker_id,
      nonStrikerId: rep.non_striker_id,
      bowlerId: rep.bowler_id,
      isBoundaryFour: rep.runs_batter === 4 && !rep.extra_type,
      isBoundarySix: rep.runs_batter === 6 && !rep.extra_type,
    };

    const runsTotal = calculateRunsTotal(calcInput);
    const legal = isLegalDelivery(calcInput);

    const { data: repRow } = await supabase
      .from("cricket_ball_events")
      .insert({
        match_id: rep.match_id,
        innings_id: rep.innings_id,
        batting_team_id: orig.batting_team_id as string ?? "",
        bowling_team_id: orig.bowling_team_id as string ?? "",
        over_number: rep.over_number,
        ball_in_over: rep.ball_in_over,
        striker_id: rep.striker_id,
        non_striker_id: rep.non_striker_id,
        bowler_id: rep.bowler_id,
        runs_batter: rep.runs_batter,
        runs_extras: rep.runs_extras,
        runs_total: runsTotal,
        extra_type: rep.extra_type ?? null,
        wicket_type: rep.wicket_type ?? null,
        player_out_id: rep.player_out_id ?? null,
        fielder_player_id: rep.fielder_player_id ?? null,
        is_legal_delivery: legal,
        is_wicket: Boolean(rep.wicket_type),
        is_boundary_four: calcInput.isBoundaryFour ?? false,
        is_boundary_six: calcInput.isBoundarySix ?? false,
        is_dot_ball: runsTotal === 0 && !rep.wicket_type,
        correction_of_event_id: input.event_id,
        is_correction: true,
        scorer_user_id: auth.userId,
        commentary: rep.commentary ?? null,
      })
      .select("id")
      .single();

    if (repRow) replacementEventId = (repRow as Record<string, unknown>).id as string;
  }

  // Record correction log
  await supabase
    .from("cricket_ball_event_corrections")
    .insert({
      match_id: matchId,
      original_event_id: input.event_id,
      replacement_event_id: replacementEventId,
      correction_type: input.correction_type,
      reason: input.reason ?? null,
      corrected_by: auth.userId,
    });

  return rebuildLiveScoreFromEvents(matchId, inningsId, auth.userId);
}

// ─── 8. rebuildLiveScoreFromEvents ───────────────────────────────────────────

export async function rebuildLiveScoreFromEvents(
  matchId: string,
  inningsId: string,
  callerUserId?: string
): Promise<ActionResult<CricketLiveMatchState>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  let userId = callerUserId;
  if (!userId) {
    const auth = await requireScorer(matchId);
    if ("error" in auth) return { success: false, error: auth.error };
    userId = auth.userId;
  }

  // Fetch all non-deleted events ordered by created_at
  const { data: eventRows } = await supabase
    .from("cricket_ball_events")
    .select("*")
    .eq("match_id", matchId)
    .eq("innings_id", inningsId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  const events: CalcBallEventInput[] = (eventRows ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      runsBatter: (row.runs_batter as number) ?? 0,
      runsExtras: (row.runs_extras as number) ?? 0,
      extraType: (row.extra_type as CalcBallEventInput["extraType"]) ?? undefined,
      wicketType: (row.wicket_type as CalcBallEventInput["wicketType"]) ?? undefined,
      playerOutId: (row.player_out_id as string | null) ?? undefined,
      strikerId: (row.striker_id as string | null) ?? undefined,
      nonStrikerId: (row.non_striker_id as string | null) ?? undefined,
      bowlerId: (row.bowler_id as string | null) ?? undefined,
      isBoundaryFour: (row.is_boundary_four as boolean) ?? false,
      isBoundarySix: (row.is_boundary_six as boolean) ?? false,
    };
  });

  const rebuilt = rebuildInningsStateFromEvents(events, {
    totalRuns: 0,
    wicketsLost: 0,
    ballsBowled: 0,
    extrasTotal: 0,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penaltyRuns: 0,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
  });

  const newCrr = calculateLiveRunRate(rebuilt.totalRuns, rebuilt.ballsBowled);

  // Fetch last event for lastEventId
  const { data: lastRow } = await supabase
    .from("cricket_ball_events")
    .select("id")
    .eq("match_id", matchId)
    .eq("innings_id", inningsId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastEventId = lastRow ? (lastRow as Record<string, unknown>).id as string : null;

  // Update innings
  await supabase
    .from("cricket_innings")
    .update({
      total_runs: rebuilt.totalRuns,
      wickets_lost: rebuilt.wicketsLost,
      balls_bowled: rebuilt.ballsBowled,
      overs_text: ballsToOversText(rebuilt.ballsBowled),
      extras_total: rebuilt.extrasTotal,
      run_rate: newCrr,
    })
    .eq("id", inningsId);

  // Update live state
  const { data: updatedState } = await supabase
    .from("cricket_live_match_state")
    .update({
      total_runs: rebuilt.totalRuns,
      wickets_lost: rebuilt.wicketsLost,
      balls_bowled: rebuilt.ballsBowled,
      overs_text: ballsToOversText(rebuilt.ballsBowled),
      extras_total: rebuilt.extrasTotal,
      striker_id: rebuilt.strikerId,
      non_striker_id: rebuilt.nonStrikerId,
      current_run_rate: newCrr,
      last_event_id: lastEventId,
      updated_by: userId,
    })
    .eq("match_id", matchId)
    .select()
    .single();

  if (!updatedState) return { success: false, error: "Failed to update live state after rebuild" };

  return { success: true, data: liveStateFromRow(updatedState as Record<string, unknown>) };
}

// ─── 9. completeLiveScoring ──────────────────────────────────────────────────

export async function completeLiveScoring(
  matchId: string
): Promise<ActionResult> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  await supabase
    .from("cricket_matches")
    .update({
      live_scoring_status: "completed",
      scorecard_status: "completed",
      match_status: "completed",
      live_ended_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  await supabase
    .from("cricket_live_match_state")
    .update({ status: "completed", updated_by: auth.userId })
    .eq("match_id", matchId);

  await supabase
    .from("cricket_live_scoring_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .in("status", ["active", "paused"]);

  return { success: true };
}

// ─── 10. setNextBatter ───────────────────────────────────────────────────────

export async function setNextBatter(
  matchId: string,
  newBatterId: string
): Promise<ActionResult<CricketLiveMatchState>> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: updatedState } = await supabase
    .from("cricket_live_match_state")
    .update({ striker_id: newBatterId, updated_by: auth.userId })
    .eq("match_id", matchId)
    .select()
    .single();

  await supabase
    .from("cricket_matches")
    .update({ current_batter_id: newBatterId })
    .eq("id", matchId);

  if (!updatedState) return { success: false, error: "Failed to set next batter" };
  return { success: true, data: liveStateFromRow(updatedState as Record<string, unknown>) };
}

// ─── 11. setNextBowler ───────────────────────────────────────────────────────

export async function setNextBowler(
  matchId: string,
  newBowlerId: string
): Promise<ActionResult<CricketLiveMatchState>> {
  const auth = await requireScorer(matchId);
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: updatedState } = await supabase
    .from("cricket_live_match_state")
    .update({ bowler_id: newBowlerId, updated_by: auth.userId })
    .eq("match_id", matchId)
    .select()
    .single();

  await supabase
    .from("cricket_matches")
    .update({ current_bowler_id: newBowlerId })
    .eq("id", matchId);

  if (!updatedState) return { success: false, error: "Failed to set next bowler" };
  return { success: true, data: liveStateFromRow(updatedState as Record<string, unknown>) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertBattingEntry(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: BallEventInput,
  calcInput: CalcBallEventInput,
  _runsTotal: number,
  _eventId: string
) {
  if (!supabase) return;
  if (!input.striker_id) return;

  const isWicket = Boolean(input.wicket_type);
  const isPlayerOut = input.player_out_id === input.striker_id;
  const isFour = input.runs_batter === 4 && !input.extra_type;
  const isSix = input.runs_batter === 6 && !input.extra_type;
  const isLegal = isLegalDelivery(calcInput);

  // Upsert batting entry: increment runs/balls/fours/sixes
  const { data: existing } = await supabase
    .from("cricket_batting_scorecard_entries")
    .select("id, runs, balls, fours, sixes, is_out")
    .eq("innings_id", input.innings_id)
    .eq("player_id", input.striker_id)
    .maybeSingle();

  if (existing) {
    const ex = existing as Record<string, unknown>;
    const deltaRuns = input.runs_batter;
    const deltaBalls = isLegal ? 1 : 0;
    const deltaFours = isFour ? 1 : 0;
    const deltaSixes = isSix ? 1 : 0;
    const newRuns = ((ex.runs as number) ?? 0) + deltaRuns;
    const newBalls = ((ex.balls as number) ?? 0) + deltaBalls;
    const newFours = ((ex.fours as number) ?? 0) + deltaFours;
    const newSixes = ((ex.sixes as number) ?? 0) + deltaSixes;

    await supabase
      .from("cricket_batting_scorecard_entries")
      .update({
        runs: newRuns,
        balls: newBalls,
        fours: newFours,
        sixes: newSixes,
        is_out: isWicket && isPlayerOut ? true : (ex.is_out as boolean) ?? false,
        dismissal_type: isWicket && isPlayerOut ? input.wicket_type : (ex.dismissal_type as string | null) ?? null,
        dismissed_by_player_id: isWicket && isPlayerOut ? input.bowler_id : (ex.dismissed_by_player_id as string | null) ?? null,
        fielder_player_id: isWicket && isPlayerOut && input.fielder_player_id ? input.fielder_player_id : (ex.fielder_player_id as string | null) ?? null,
      })
      .eq("id", ex.id as string);
  } else {
    // Create new entry
    await supabase
      .from("cricket_batting_scorecard_entries")
      .insert({
        innings_id: input.innings_id,
        match_id: input.match_id,
        team_id: "",
        player_id: input.striker_id,
        runs: input.runs_batter,
        balls: isLegal ? 1 : 0,
        fours: isFour ? 1 : 0,
        sixes: isSix ? 1 : 0,
        is_out: isWicket && isPlayerOut,
        dismissal_type: isWicket && isPlayerOut ? input.wicket_type : null,
        dismissed_by_player_id: isWicket && isPlayerOut ? input.bowler_id : null,
        fielder_player_id: isWicket && isPlayerOut ? input.fielder_player_id : null,
      })
      .select("id");
  }
}

async function upsertBowlingEntry(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: BallEventInput,
  calcInput: CalcBallEventInput,
  runsTotal: number,
  _eventId: string
) {
  if (!supabase) return;
  if (!input.bowler_id) return;

  const isLegal = isLegalDelivery(calcInput);
  const isWicket = Boolean(input.wicket_type) && !["run_out", "retired_hurt", "retired_out", "obstructing_field"].includes(input.wicket_type ?? "");
  const isWide = input.extra_type === "wide";
  const isNoBall = input.extra_type === "no_ball" || input.extra_type === "no_ball_bye" || input.extra_type === "no_ball_leg_bye";
  const isFour = input.runs_batter === 4 && !input.extra_type;
  const isSix = input.runs_batter === 6 && !input.extra_type;
  const isDot = runsTotal === 0 && isLegal;

  const { data: existing } = await supabase
    .from("cricket_bowling_scorecard_entries")
    .select("id, balls_bowled, runs_conceded, wickets, wides, no_balls, dots, fours_conceded, sixes_conceded")
    .eq("innings_id", input.innings_id)
    .eq("player_id", input.bowler_id)
    .maybeSingle();

  if (existing) {
    const ex = existing as Record<string, unknown>;
    await supabase
      .from("cricket_bowling_scorecard_entries")
      .update({
        balls_bowled: ((ex.balls_bowled as number) ?? 0) + (isLegal ? 1 : 0),
        runs_conceded: ((ex.runs_conceded as number) ?? 0) + runsTotal,
        wickets: ((ex.wickets as number) ?? 0) + (isWicket ? 1 : 0),
        wides: ((ex.wides as number) ?? 0) + (isWide ? 1 : 0),
        no_balls: ((ex.no_balls as number) ?? 0) + (isNoBall ? 1 : 0),
        dots: ((ex.dots as number) ?? 0) + (isDot ? 1 : 0),
        fours_conceded: ((ex.fours_conceded as number) ?? 0) + (isFour ? 1 : 0),
        sixes_conceded: ((ex.sixes_conceded as number) ?? 0) + (isSix ? 1 : 0),
      })
      .eq("id", ex.id as string);
  } else {
    await supabase
      .from("cricket_bowling_scorecard_entries")
      .insert({
        innings_id: input.innings_id,
        match_id: input.match_id,
        team_id: "",
        player_id: input.bowler_id,
        balls_bowled: isLegal ? 1 : 0,
        runs_conceded: runsTotal,
        wickets: isWicket ? 1 : 0,
        wides: isWide ? 1 : 0,
        no_balls: isNoBall ? 1 : 0,
        dots: isDot ? 1 : 0,
        fours_conceded: isFour ? 1 : 0,
        sixes_conceded: isSix ? 1 : 0,
      });
  }
}

// ─── buildEventNotation re-export for server actions ─────────────────────────
export { buildEventNotation };
