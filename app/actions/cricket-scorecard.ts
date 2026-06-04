"use server";

import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  saveSquadsSchema,
  tossSchema,
  inningsSchema,
  battingEntriesSchema,
  bowlingEntriesSchema,
  resultFinalizationSchema,
} from "@/lib/cricket/validation/scorecard";
import {
  ballsToOversText,
  calculateStrikeRate,
  calculateEconomyRate,
  calculateRunRate,
  calculateExtrasTotal,
  validateScorecardConsistency,
} from "@/lib/cricket/scorecards/calculations";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { userCanManageCricketLeague } from "@/lib/cricket/matches/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { success: true; data: T; warnings?: string[] }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insertScorecardLog(
  matchId: string | null,
  inningsId: string | null,
  actorUserId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  oldValue: Record<string, unknown> = {},
  newValue: Record<string, unknown> = {}
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;
  await supabase.from("cricket_scorecard_change_logs").insert({
    match_id: matchId,
    innings_id: inningsId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    old_value: oldValue,
    new_value: newValue,
  });
}

async function getMatchForScoring(matchId: string, userId: string): Promise<{ leagueId: string | null; homeTeamId: string | null; awayTeamId: string | null } | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;
  const canScore = await userCanScoreCricketMatch(userId, matchId);
  if (!canScore) return null;
  const { data } = await supabase
    .from("cricket_matches")
    .select("league_id, home_team_id, away_team_id")
    .eq("id", matchId)
    .single();
  return data as { leagueId: string | null; homeTeamId: string | null; awayTeamId: string | null } | null;
}

// ─── startCricketMatchSetup ───────────────────────────────────────────────────

export async function startCricketMatchSetup(matchId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({ scorecard_status: "setup" })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to start match setup." };

  await insertScorecardLog(matchId, null, user.id, "match.setup_started");
  return { success: true, data: undefined };
}

// ─── saveCricketMatchSquads ───────────────────────────────────────────────────

export async function saveCricketMatchSquads(rawInput: unknown): Promise<ActionResult<{ saved: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = saveSquadsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const { matchId, homeTeamId, awayTeamId, homeSquad, awaySquad } = parsed.data;

  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Delete existing squads and re-insert
  await supabase.from("cricket_match_squads").delete().eq("match_id", matchId);

  const rows = [
    ...homeSquad.map((p) => ({
      match_id: matchId,
      team_id: homeTeamId,
      player_id: p.playerId,
      is_playing_xi: p.isPlayingXi,
      batting_position: p.battingPosition ?? null,
      is_captain: p.isCaptain,
      is_wicketkeeper: p.isWicketkeeper,
      is_substitute: p.isSubstitute,
      created_by: user.id,
    })),
    ...awaySquad.map((p) => ({
      match_id: matchId,
      team_id: awayTeamId,
      player_id: p.playerId,
      is_playing_xi: p.isPlayingXi,
      batting_position: p.battingPosition ?? null,
      is_captain: p.isCaptain,
      is_wicketkeeper: p.isWicketkeeper,
      is_substitute: p.isSubstitute,
      created_by: user.id,
    })),
  ];

  const { error, count } = await supabase.from("cricket_match_squads").insert(rows).select("id");
  if (error) {
    console.error("[cricket-scorecard/actions] saveCricketMatchSquads:", error.message);
    return { success: false, error: "Failed to save squads." };
  }

  await insertScorecardLog(matchId, null, user.id, "match.squad_updated", "match_squads", matchId);
  return { success: true, data: { saved: rows.length } };
}

// ─── recordCricketToss ────────────────────────────────────────────────────────

export async function recordCricketToss(rawInput: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = tossSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const { tossWinnerTeamId, tossDecision } = parsed.data;
  const matchIdRaw = (rawInput as Record<string, unknown>).matchId as string | undefined;
  if (!matchIdRaw) return { success: false, error: "matchId is required." };

  const canScore = await userCanScoreCricketMatch(user.id, matchIdRaw);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({
      toss_winner_team_id: tossWinnerTeamId,
      toss_decision: tossDecision,
    })
    .eq("id", matchIdRaw);

  if (error) return { success: false, error: "Failed to record toss." };

  await insertScorecardLog(matchIdRaw, null, user.id, "toss.recorded", "match", matchIdRaw, {}, {
    tossWinnerTeamId,
    tossDecision,
  });
  return { success: true, data: undefined };
}

// ─── createOrUpdateCricketInnings ─────────────────────────────────────────────

export async function createOrUpdateCricketInnings(
  rawInput: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = inningsSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const input = parsed.data;
  const canScore = await userCanScoreCricketMatch(user.id, input.matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const extrasTotal = calculateExtrasTotal({
    byes: input.byes,
    legByes: input.legByes,
    wides: input.wides,
    noBalls: input.noBalls,
    penaltyRuns: input.penaltyRuns,
  });

  const runRate = calculateRunRate(input.totalRuns, input.ballsBowled);
  const oversText = ballsToOversText(input.ballsBowled);

  const upsertRow = {
    match_id: input.matchId,
    innings_number: input.inningsNumber,
    batting_team_id: input.battingTeamId,
    bowling_team_id: input.bowlingTeamId,
    total_runs: input.totalRuns,
    wickets_lost: input.wicketsLost,
    balls_bowled: input.ballsBowled,
    overs_text: oversText,
    extras_total: extrasTotal,
    byes: input.byes ?? 0,
    leg_byes: input.legByes ?? 0,
    wides: input.wides ?? 0,
    no_balls: input.noBalls ?? 0,
    penalty_runs: input.penaltyRuns ?? 0,
    target_runs: input.targetRuns ?? null,
    run_rate: runRate,
    innings_status: input.inningsStatus,
    declared: input.declared,
    all_out: input.allOut,
    notes: input.notes ?? null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("cricket_innings")
    .upsert(upsertRow, { onConflict: "match_id,innings_number" })
    .select("id")
    .single();

  if (error) {
    console.error("[cricket-scorecard/actions] createOrUpdateCricketInnings:", error.message);
    return { success: false, error: "Failed to save innings." };
  }

  const inningsId = (data as { id: string }).id;
  await insertScorecardLog(input.matchId, inningsId, user.id, "innings.updated", "innings", inningsId);

  // Update match scorecard_status if needed
  await supabase
    .from("cricket_matches")
    .update({ scorecard_status: "in_progress" })
    .eq("id", input.matchId)
    .eq("scorecard_status", "setup");

  return { success: true, data: { id: inningsId } };
}

// ─── saveBattingScorecardEntries ──────────────────────────────────────────────

export async function saveBattingScorecardEntries(
  rawInput: unknown
): Promise<ActionResult<{ saved: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = battingEntriesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const { inningsId, matchId, teamId, entries } = parsed.data;
  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const rows = entries.map((e) => ({
    innings_id: inningsId,
    match_id: matchId,
    team_id: teamId,
    player_id: e.playerId,
    batting_position: e.battingPosition ?? null,
    runs: e.runs,
    balls: e.balls,
    fours: e.fours ?? 0,
    sixes: e.sixes ?? 0,
    minutes: e.minutes ?? null,
    strike_rate: calculateStrikeRate(e.runs, e.balls),
    dismissal_type: e.dismissalType ?? null,
    bowler_player_id: e.bowlerPlayerId ?? null,
    fielder_player_id: e.fielderPlayerId ?? null,
    is_out: e.isOut ?? false,
    did_not_bat: e.didNotBat ?? false,
    retired_hurt: e.retiredHurt ?? false,
    retired_out: e.retiredOut ?? false,
    notes: e.notes ?? null,
  }));

  const { error } = await supabase
    .from("cricket_batting_scorecard_entries")
    .upsert(rows, { onConflict: "innings_id,player_id" });

  if (error) {
    console.error("[cricket-scorecard/actions] saveBattingScorecardEntries:", error.message);
    return { success: false, error: "Failed to save batting entries." };
  }

  await insertScorecardLog(matchId, inningsId, user.id, "batting_entry.updated");
  return { success: true, data: { saved: rows.length } };
}

// ─── saveBowlingScorecardEntries ──────────────────────────────────────────────

export async function saveBowlingScorecardEntries(
  rawInput: unknown
): Promise<ActionResult<{ saved: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = bowlingEntriesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const { inningsId, matchId, teamId, entries } = parsed.data;
  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const rows = entries.map((e) => ({
    innings_id: inningsId,
    match_id: matchId,
    team_id: teamId,
    player_id: e.playerId,
    balls_bowled: e.ballsBowled,
    overs_text: ballsToOversText(e.ballsBowled),
    maidens: e.maidens ?? 0,
    runs_conceded: e.runsConceded,
    wickets: e.wickets,
    wides: e.wides ?? 0,
    no_balls: e.noBalls ?? 0,
    economy_rate: calculateEconomyRate(e.runsConceded, e.ballsBowled),
    dots: e.dots ?? 0,
    fours_conceded: e.foursConceded ?? 0,
    sixes_conceded: e.sixesConceded ?? 0,
    notes: e.notes ?? null,
  }));

  const { error } = await supabase
    .from("cricket_bowling_scorecard_entries")
    .upsert(rows, { onConflict: "innings_id,player_id" });

  if (error) {
    console.error("[cricket-scorecard/actions] saveBowlingScorecardEntries:", error.message);
    return { success: false, error: "Failed to save bowling entries." };
  }

  await insertScorecardLog(matchId, inningsId, user.id, "bowling_entry.updated");
  return { success: true, data: { saved: rows.length } };
}

// ─── saveFallOfWickets ────────────────────────────────────────────────────────

export async function saveFallOfWickets(
  inningsId: string,
  matchId: string,
  entries: Array<{
    wicketNumber: number;
    teamScore: number;
    ballsElapsed?: number | null;
    playerOutId?: string | null;
    partnershipRuns?: number | null;
    partnershipBalls?: number | null;
    notes?: string | null;
  }>
): Promise<ActionResult<{ saved: number }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Delete existing FOW for this innings and re-insert
  await supabase.from("cricket_fall_of_wickets").delete().eq("innings_id", inningsId);

  if (entries.length === 0) return { success: true, data: { saved: 0 } };

  const rows = entries.map((e) => ({
    innings_id: inningsId,
    match_id: matchId,
    wicket_number: e.wicketNumber,
    team_score: e.teamScore,
    balls_elapsed: e.ballsElapsed ?? null,
    overs_text: e.ballsElapsed != null ? ballsToOversText(e.ballsElapsed) : null,
    player_out_id: e.playerOutId ?? null,
    partnership_runs: e.partnershipRuns ?? null,
    partnership_balls: e.partnershipBalls ?? null,
    notes: e.notes ?? null,
  }));

  const { error } = await supabase.from("cricket_fall_of_wickets").insert(rows);
  if (error) return { success: false, error: "Failed to save fall of wickets." };

  await insertScorecardLog(matchId, inningsId, user.id, "fall_of_wicket.updated");
  return { success: true, data: { saved: rows.length } };
}

// ─── validateAndCompleteScorecard ─────────────────────────────────────────────

export async function validateAndCompleteScorecard(matchId: string): Promise<ActionResult<{ warnings: string[] }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const canScore = await userCanScoreCricketMatch(user.id, matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  // Fetch innings for consistency check
  const { data: inningsRows } = await supabase
    .from("cricket_innings")
    .select("*, batting_entries:cricket_batting_scorecard_entries(runs), bowling_entries:cricket_bowling_scorecard_entries(balls_bowled, wickets)")
    .eq("match_id", matchId);

  const allWarnings: string[] = [];

  for (const inn of (inningsRows ?? []) as Record<string, unknown>[]) {
    const battingEntries = (inn.batting_entries as Array<{ runs: number }>) ?? [];
    const bowlingEntries = (inn.bowling_entries as Array<{ balls_bowled: number; wickets: number }>) ?? [];

    const battingRunsSum = battingEntries.reduce((s, e) => s + e.runs, 0);
    const bowlingBallsSum = bowlingEntries.reduce((s, e) => s + e.balls_bowled, 0);
    const bowlingWicketsSum = bowlingEntries.reduce((s, e) => s + e.wickets, 0);

    const warnings = validateScorecardConsistency({
      inningsTotalRuns: inn.total_runs as number,
      extrasTotal: inn.extras_total as number,
      battingRunsSum,
      wicketsLost: inn.wickets_lost as number,
      ballsBowled: inn.balls_bowled as number,
      bowlingBallsSum,
      bowlingWicketsSum,
    });

    allWarnings.push(...warnings.map((w) => `Innings ${inn.innings_number}: ${w.message}`));
  }

  // Even with warnings, allow completing if user acknowledges
  const { error } = await supabase
    .from("cricket_matches")
    .update({ scorecard_status: "completed" })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to complete scorecard." };

  await insertScorecardLog(matchId, null, user.id, "scorecard.completed");
  return { success: true, data: { warnings: allWarnings }, warnings: allWarnings };
}

// ─── finalizeCricketMatchResult ───────────────────────────────────────────────

export async function finalizeCricketMatchResult(rawInput: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const parsed = resultFinalizationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed." };
  }

  const input = parsed.data;
  const canScore = await userCanScoreCricketMatch(user.id, input.matchId);
  if (!canScore) return { success: false, error: "Permission denied." };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({
      match_result_type: input.resultType,
      winning_team_id: input.winningTeamId ?? null,
      losing_team_id: input.losingTeamId ?? null,
      result_margin_runs: input.marginRuns ?? null,
      result_margin_wickets: input.marginWickets ?? null,
      result_margin_balls_remaining: input.marginBallsRemaining ?? null,
      player_of_match_id: input.playerOfMatchId ?? null,
      result_summary: input.resultSummary ?? null,
      match_status: "completed",
      schedule_status: "completed",
      scorecard_status: "completed",
      result_confirmed_by: user.id,
      result_confirmed_at: new Date().toISOString(),
    })
    .eq("id", input.matchId);

  if (error) return { success: false, error: "Failed to finalize result." };

  await insertScorecardLog(input.matchId, null, user.id, "result.finalized", "match", input.matchId, {}, {
    resultType: input.resultType,
    winningTeamId: input.winningTeamId,
  });

  return { success: true, data: undefined };
}

// ─── lockCricketScorecard ─────────────────────────────────────────────────────

export async function lockCricketScorecard(matchId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Lock requires manage (not just score) permission
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database not available." };

  const { data: match } = await supabase
    .from("cricket_matches")
    .select("league_id")
    .eq("id", matchId)
    .single();

  if (!match) return { success: false, error: "Match not found." };
  const leagueId = (match as Record<string, unknown>).league_id as string | null;
  if (!leagueId) return { success: false, error: "Match has no league." };

  const canManage = await userCanManageCricketLeague(user.id, leagueId);
  if (!canManage) return { success: false, error: "Only league admins can lock scorecards." };

  const { error } = await supabase
    .from("cricket_matches")
    .update({ scorecard_status: "locked" })
    .eq("id", matchId);

  if (error) return { success: false, error: "Failed to lock scorecard." };

  await insertScorecardLog(matchId, null, user.id, "scorecard.locked");
  return { success: true, data: undefined };
}
