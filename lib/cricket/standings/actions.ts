"use server";

/**
 * lib/cricket/standings/actions.ts
 * Server actions for cricket standings rebuilds.
 * All mutations persist to Supabase — no fake data.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { standingsRebuildSchema, type StandingsRebuildInput } from "@/lib/cricket/validation/standings";
import {
  calculateMatchTeamResults,
  aggregateTeamStandings,
  validateStandingsConsistency,
  type MatchForResult,
  type MatchResultForAggregation,
  type PointsSettings,
} from "./calculations";

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface RebuildSummary {
  leagueId: string;
  matchesProcessed: number;
  teamsUpdated: number;
  snapshotCreated: boolean;
  warnings: string[];
  calculatedAt: string;
}

// ─── Main actions ─────────────────────────────────────────────────────────────

export async function rebuildCricketLeagueStandings(
  rawInput: StandingsRebuildInput
): Promise<ActionResult<RebuildSummary>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = standingsRebuildSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Authorization
  const { data: canRebuild } = await supabase.rpc("user_can_rebuild_cricket_stats", {
    _league_id: input.leagueId,
    _user_id: user.id,
  });
  if (!canRebuild) {
    return { success: false, error: "Not authorized to rebuild standings for this league" };
  }

  // Fetch league settings
  const { data: league } = await supabase
    .from("cricket_leagues")
    .select("id, overs_per_innings, points_win, points_loss, points_tie, points_no_result")
    .eq("id", input.leagueId)
    .single();
  if (!league) return { success: false, error: "League not found" };

  const { data: settings } = await supabase
    .from("cricket_league_settings")
    .select("points_win, points_loss, points_tie, points_no_result, net_run_rate_enabled, bonus_points_enabled")
    .eq("league_id", input.leagueId)
    .single();

  const pointsSettings: PointsSettings = {
    pointsWin: (settings?.points_win as number | null) ?? (league.points_win as number) ?? 2,
    pointsLoss: (settings?.points_loss as number | null) ?? (league.points_loss as number) ?? 0,
    pointsTie: (settings?.points_tie as number | null) ?? (league.points_tie as number) ?? 1,
    pointsNoResult: (settings?.points_no_result as number | null) ?? (league.points_no_result as number) ?? 1,
    bonusPointsEnabled: (settings?.bonus_points_enabled as boolean | null) ?? false,
    netRunRateEnabled: (settings?.net_run_rate_enabled as boolean | null) ?? true,
  };

  // Fetch completed matches for the league
  let matchQuery = supabase
    .from("cricket_matches")
    .select("id, home_team_id, away_team_id, match_result_type, winning_team_id, losing_team_id, match_status, scorecard_status, league_id")
    .eq("league_id", input.leagueId)
    .eq("match_status", "completed");

  if (!input.includeUnpublishedMatches) {
    matchQuery = matchQuery.eq("publish_status", "published");
  }
  if (!input.includeIncompletescorecards) {
    matchQuery = matchQuery.in("scorecard_status", ["completed", "locked"]);
  }

  const { data: matches, error: matchError } = await matchQuery;
  if (matchError) return { success: false, error: matchError.message };

  const matchList = matches ?? [];
  if (matchList.length === 0) {
    return {
      success: true,
      data: {
        leagueId: input.leagueId,
        matchesProcessed: 0,
        teamsUpdated: 0,
        snapshotCreated: false,
        warnings: ["No completed matches found for this league."],
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // Fetch innings for these matches
  const matchIds = matchList.map((m) => m.id as string);
  const { data: inningsRows } = await supabase
    .from("cricket_innings")
    .select("id, match_id, batting_team_id, total_runs, wickets_lost, balls_bowled, all_out, innings_status")
    .in("match_id", matchIds);

  const inningsByMatch = new Map<string, typeof inningsRows>();
  for (const inn of (inningsRows ?? [])) {
    const key = inn.match_id as string;
    if (!inningsByMatch.has(key)) inningsByMatch.set(key, []);
    inningsByMatch.get(key)!.push(inn);
  }

  const scheduledOvers = (league.overs_per_innings as number) ?? 20;

  // Collect all team IDs
  const allTeamIds = new Set<string>();
  for (const m of matchList) {
    if (m.home_team_id) allTeamIds.add(m.home_team_id as string);
    if (m.away_team_id) allTeamIds.add(m.away_team_id as string);
  }

  // Process match results
  const allMatchResults: MatchResultForAggregation[] = [];
  const warnings: string[] = [];

  for (const m of matchList) {
    const matchInnings = (inningsByMatch.get(m.id as string) ?? []).map((inn) => ({
      battingTeamId: inn.batting_team_id as string,
      totalRuns: (inn.total_runs as number) ?? 0,
      wicketsLost: (inn.wickets_lost as number) ?? 0,
      ballsBowled: (inn.balls_bowled as number) ?? 0,
      allOut: (inn.all_out as boolean) ?? false,
      scheduledOvers,
    }));

    const matchForResult: MatchForResult = {
      id: m.id as string,
      leagueId: m.league_id as string | null,
      homeTeamId: m.home_team_id as string | null,
      awayTeamId: m.away_team_id as string | null,
      matchResultType: m.match_result_type as string | null,
      winningTeamId: m.winning_team_id as string | null,
      losingTeamId: m.losing_team_id as string | null,
      matchStatus: m.match_status as string,
      scorecardStatus: m.scorecard_status as string,
      innings: matchInnings,
    };

    const results = calculateMatchTeamResults(matchForResult, pointsSettings);

    // Upsert match team results
    for (const res of results) {
      const upsertData = {
        match_id: m.id,
        league_id: input.leagueId,
        team_id: res.teamId,
        opponent_team_id: res.opponentTeamId,
        result: res.result,
        points: res.points,
        bonus_points: res.bonusPoints,
        runs_for: res.runsFor,
        balls_for: res.ballsFor,
        wickets_lost: res.wicketsLost,
        runs_against: res.runsAgainst,
        balls_against: res.ballsAgainst,
        wickets_taken: res.wicketsTaken,
        net_run_rate_delta: res.netRunRateDelta,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("cricket_match_team_results")
        .upsert(upsertData, { onConflict: "match_id,team_id" });

      if (upsertErr) {
        warnings.push(`Failed to upsert match result for team ${res.teamId}: ${upsertErr.message}`);
      }

      allMatchResults.push({
        matchId: m.id as string,
        teamId: res.teamId,
        result: res.result,
        points: res.points,
        bonusPoints: res.bonusPoints,
        runsFor: res.runsFor,
        ballsFor: res.ballsFor,
        wicketsLost: res.wicketsLost,
        runsAgainst: res.runsAgainst,
        ballsAgainst: res.ballsAgainst,
        wicketsTaken: res.wicketsTaken,
      });
    }

    // Mark standings applied
    await supabase
      .from("cricket_matches")
      .update({ standings_applied: true, standings_applied_at: new Date().toISOString() })
      .eq("id", m.id);
  }

  // Aggregate standings
  const teamIds = Array.from(allTeamIds);
  const standings = aggregateTeamStandings(allMatchResults, teamIds, pointsSettings);
  const consistencyWarnings = validateStandingsConsistency(standings);
  warnings.push(...consistencyWarnings.map((w) => w.message));

  const now = new Date().toISOString();

  // Upsert standings
  for (const s of standings) {
    const upsertData = {
      league_id: input.leagueId,
      team_id: s.teamId,
      matches_played: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      ties: s.ties,
      no_results: s.noResults,
      abandoned: s.abandoned,
      forfeits_for: s.forfeitsFor,
      forfeits_against: s.forfeitsAgainst,
      points: s.points,
      bonus_points: s.bonusPoints,
      total_points: s.totalPoints,
      runs_for: s.runsFor,
      balls_for: s.ballsFor,
      runs_against: s.runsAgainst,
      balls_against: s.ballsAgainst,
      wickets_for: s.wicketsFor,
      wickets_against: s.wicketsAgainst,
      net_run_rate: s.netRunRate,
      position: s.position,
      form: s.form,
      last_match_id: s.lastMatchId,
      calculated_at: now,
      updated_at: now,
    };

    const { error: standErr } = await supabase
      .from("cricket_team_standings")
      .upsert(upsertData, { onConflict: "league_id,team_id" });

    if (standErr) {
      warnings.push(`Failed to upsert standings for team ${s.teamId}: ${standErr.message}`);
    }
  }

  // Create snapshot if requested
  let snapshotCreated = false;
  if (input.snapshot && standings.length > 0) {
    const { error: snapErr } = await supabase
      .from("cricket_standings_snapshots")
      .insert({
        league_id: input.leagueId,
        snapshot_type: "rebuild",
        generated_by: user.id,
        standings: standings as unknown as Record<string, unknown>[],
        summary: {
          matchesProcessed: matchList.length,
          teamsUpdated: standings.length,
          rebuiltAt: now,
        },
      });

    if (!snapErr) snapshotCreated = true;
    else warnings.push(`Snapshot creation failed: ${snapErr.message}`);
  }

  return {
    success: true,
    data: {
      leagueId: input.leagueId,
      matchesProcessed: matchList.length,
      teamsUpdated: standings.length,
      snapshotCreated,
      warnings,
      calculatedAt: now,
    },
  };
}

export async function createCricketStandingsSnapshot(
  leagueId: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: canRebuild } = await supabase.rpc("user_can_rebuild_cricket_stats", {
    _league_id: leagueId,
    _user_id: user.id,
  });
  if (!canRebuild) return { success: false, error: "Not authorized" };

  const standings = await import("./queries").then((m) => m.getCricketLeagueStandings(leagueId));

  const { data, error } = await supabase
    .from("cricket_standings_snapshots")
    .insert({
      league_id: leagueId,
      snapshot_type: "manual",
      generated_by: user.id,
      standings: standings as unknown as Record<string, unknown>[],
      summary: { createdAt: new Date().toISOString(), count: standings.length },
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}
