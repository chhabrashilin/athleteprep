"use server";

/**
 * lib/cricket/stats/actions.ts
 * Server actions for cricket player stats rebuilds.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { standingsRebuildSchema, type StandingsRebuildInput } from "@/lib/cricket/validation/standings";
import {
  aggregatePlayerStatsFromScorecards,
  calculateBattingAverage,
  calculateBattingStrikeRate,
  calculateBowlingAverage,
  calculateEconomyRate,
  calculateBowlingStrikeRate,
  type PlayerScorecardData,
} from "./player-calculations";
import type { ActionResult } from "@/lib/cricket/standings/actions";

export interface PlayerStatsRebuildSummary {
  leagueId: string;
  matchesProcessed: number;
  playersUpdated: number;
  snapshotCreated: boolean;
  warnings: string[];
  calculatedAt: string;
}

export async function rebuildCricketPlayerStats(
  rawInput: StandingsRebuildInput
): Promise<ActionResult<PlayerStatsRebuildSummary>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = standingsRebuildSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: canRebuild } = await supabase.rpc("user_can_rebuild_cricket_stats", {
    _league_id: input.leagueId,
    _user_id: user.id,
  });
  if (!canRebuild) {
    return { success: false, error: "Not authorized to rebuild stats for this league" };
  }

  const warnings: string[] = [];

  // Fetch completed matches
  let matchQuery = supabase
    .from("cricket_matches")
    .select("id, home_team_id, away_team_id")
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
        playersUpdated: 0,
        snapshotCreated: false,
        warnings: ["No completed matches found."],
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  const matchIds = matchList.map((m) => m.id as string);

  // Fetch batting + bowling entries
  const [battingRes, bowlingRes] = await Promise.all([
    supabase
      .from("cricket_batting_scorecard_entries")
      .select("match_id, innings_id, team_id, player_id, runs, balls, fours, sixes, is_out, did_not_bat, retired_hurt")
      .in("match_id", matchIds),
    supabase
      .from("cricket_bowling_scorecard_entries")
      .select("match_id, innings_id, team_id, player_id, balls_bowled, runs_conceded, wickets, maidens, wides, no_balls")
      .in("match_id", matchIds),
  ]);

  const battingRows = battingRes.data ?? [];
  const bowlingRows = bowlingRes.data ?? [];

  // Group by player+team
  type PlayerKey = string;
  const playerDataMap = new Map<PlayerKey, PlayerScorecardData[]>();

  for (const b of battingRows) {
    const key = `${b.player_id}_${b.team_id}`;
    if (!playerDataMap.has(key)) playerDataMap.set(key, []);
    const existing = playerDataMap.get(key)!.find((d) => d.matchId === (b.match_id as string));
    if (existing) {
      existing.batting = {
        runs: (b.runs as number) ?? 0,
        balls: (b.balls as number) ?? 0,
        fours: (b.fours as number) ?? 0,
        sixes: (b.sixes as number) ?? 0,
        isOut: (b.is_out as boolean) ?? false,
        didNotBat: (b.did_not_bat as boolean) ?? false,
        retiredHurt: (b.retired_hurt as boolean) ?? false,
      };
    } else {
      playerDataMap.get(key)!.push({
        matchId: b.match_id as string,
        batting: {
          runs: (b.runs as number) ?? 0,
          balls: (b.balls as number) ?? 0,
          fours: (b.fours as number) ?? 0,
          sixes: (b.sixes as number) ?? 0,
          isOut: (b.is_out as boolean) ?? false,
          didNotBat: (b.did_not_bat as boolean) ?? false,
          retiredHurt: (b.retired_hurt as boolean) ?? false,
        },
        bowling: null,
      });
    }
  }

  for (const b of bowlingRows) {
    const key = `${b.player_id}_${b.team_id}`;
    if (!playerDataMap.has(key)) playerDataMap.set(key, []);
    const existing = playerDataMap.get(key)!.find((d) => d.matchId === (b.match_id as string));
    if (existing) {
      existing.bowling = {
        ballsBowled: (b.balls_bowled as number) ?? 0,
        runsConceded: (b.runs_conceded as number) ?? 0,
        wickets: (b.wickets as number) ?? 0,
        maidens: (b.maidens as number) ?? 0,
        wides: (b.wides as number) ?? 0,
        noBalls: (b.no_balls as number) ?? 0,
      };
    } else {
      playerDataMap.get(key)!.push({
        matchId: b.match_id as string,
        batting: null,
        bowling: {
          ballsBowled: (b.balls_bowled as number) ?? 0,
          runsConceded: (b.runs_conceded as number) ?? 0,
          wickets: (b.wickets as number) ?? 0,
          maidens: (b.maidens as number) ?? 0,
          wides: (b.wides as number) ?? 0,
          noBalls: (b.no_balls as number) ?? 0,
        },
      });
    }
  }

  const now = new Date().toISOString();
  let playersUpdated = 0;

  for (const [key, scorecards] of playerDataMap.entries()) {
    const parts = key.split("_");
    const playerId = parts[0];
    const teamId = parts[1];
    if (!playerId || !teamId) continue;

    const agg = aggregatePlayerStatsFromScorecards(scorecards);
    const outs = agg.inningsBatted - agg.notOuts;

    const upsertData = {
      league_id: input.leagueId,
      team_id: teamId,
      player_id: playerId,
      matches_played: agg.matchesPlayed,
      innings_batted: agg.inningsBatted,
      not_outs: agg.notOuts,
      runs: agg.runs,
      balls_faced: agg.ballsFaced,
      fours: agg.fours,
      sixes: agg.sixes,
      highest_score: agg.highestScore,
      batting_average: calculateBattingAverage(agg.runs, outs),
      batting_strike_rate: calculateBattingStrikeRate(agg.runs, agg.ballsFaced),
      ducks: agg.ducks,
      fifties: agg.fifties,
      hundreds: agg.hundreds,
      innings_bowled: agg.inningsBowled,
      balls_bowled: agg.ballsBowled,
      runs_conceded: agg.runsConceded,
      wickets: agg.wickets,
      maidens: agg.maidens,
      wides: agg.wides,
      no_balls: agg.noBalls,
      bowling_average: calculateBowlingAverage(agg.runsConceded, agg.wickets),
      economy_rate: calculateEconomyRate(agg.runsConceded, agg.ballsBowled),
      bowling_strike_rate: calculateBowlingStrikeRate(agg.ballsBowled, agg.wickets),
      best_bowling_wickets: agg.bestBowlingWickets,
      best_bowling_runs: agg.bestBowlingRuns,
      catches: agg.catches,
      stumpings: agg.stumpings,
      run_outs: agg.runOuts,
      calculated_at: now,
      updated_at: now,
    };

    const { error: upsertErr } = await supabase
      .from("cricket_player_stats")
      .upsert(upsertData, { onConflict: "league_id,team_id,player_id" });

    if (upsertErr) {
      warnings.push(`Failed to upsert stats for player ${playerId}: ${upsertErr.message}`);
    } else {
      playersUpdated++;
    }
  }

  // Mark stats_applied on matches
  await supabase
    .from("cricket_matches")
    .update({ stats_applied: true, stats_applied_at: now })
    .in("id", matchIds);

  // Create leaderboard snapshot if requested
  let snapshotCreated = false;
  if (input.snapshot && playersUpdated > 0) {
    const { error: snapErr } = await supabase
      .from("cricket_leaderboard_snapshots")
      .insert({
        league_id: input.leagueId,
        leaderboard_type: "batting_runs",
        generated_by: user.id,
        data: [],
        summary: { rebuiltAt: now, playersUpdated },
      });
    if (!snapErr) snapshotCreated = true;
  }

  return {
    success: true,
    data: {
      leagueId: input.leagueId,
      matchesProcessed: matchList.length,
      playersUpdated,
      snapshotCreated,
      warnings,
      calculatedAt: now,
    },
  };
}

export async function rebuildAllCricketLeagueStats(
  rawInput: StandingsRebuildInput
): Promise<ActionResult<{ standings: unknown; playerStats: unknown }>> {
  const [standingsResult, statsResult] = await Promise.all([
    import("@/lib/cricket/standings/actions").then((m) => m.rebuildCricketLeagueStandings(rawInput)),
    rebuildCricketPlayerStats(rawInput),
  ]);

  if (!standingsResult.success) return { success: false, error: standingsResult.error };
  if (!statsResult.success) return { success: false, error: statsResult.error };

  return {
    success: true,
    data: { standings: standingsResult.data, playerStats: statsResult.data },
    warnings: [...(standingsResult.warnings ?? []), ...(statsResult.warnings ?? [])],
  };
}

export async function refreshStatsAfterMatchFinalized(
  matchId: string
): Promise<ActionResult<{ standings: unknown; playerStats: unknown }>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: match } = await supabase
    .from("cricket_matches")
    .select("league_id")
    .eq("id", matchId)
    .single();

  if (!match?.league_id) {
    return { success: false, error: "Match not found or has no league" };
  }

  return rebuildAllCricketLeagueStats({
    leagueId: match.league_id as string,
    includeUnpublishedMatches: false,
    includeIncompletescorecards: false,
    nrrUseFullQuotaWhenAllOut: true,
    snapshot: false,
  });
}

export async function createCricketLeaderboardSnapshot(
  leagueId: string,
  leaderboardType: string
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

  const { data, error } = await supabase
    .from("cricket_leaderboard_snapshots")
    .insert({
      league_id: leagueId,
      leaderboard_type: leaderboardType,
      generated_by: user.id,
      data: [],
      summary: { createdAt: new Date().toISOString() },
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}
