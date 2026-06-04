/**
 * lib/cricket/stats/queries.ts
 * Data access layer for cricket player statistics.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CricketPlayerStats, CricketPlayerStatsWithPlayer } from "@/lib/cricket/types";

// ─── Row transforms ───────────────────────────────────────────────────────────

function rowToPlayerStats(row: Record<string, unknown>): CricketPlayerStats {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    playerId: row.player_id as string,
    matchesPlayed: (row.matches_played as number) ?? 0,
    inningsBatted: (row.innings_batted as number) ?? 0,
    notOuts: (row.not_outs as number) ?? 0,
    runs: (row.runs as number) ?? 0,
    ballsFaced: (row.balls_faced as number) ?? 0,
    fours: (row.fours as number) ?? 0,
    sixes: (row.sixes as number) ?? 0,
    highestScore: (row.highest_score as number) ?? 0,
    battingAverage: row.batting_average != null ? parseFloat(String(row.batting_average)) : null,
    battingStrikeRate: row.batting_strike_rate != null ? parseFloat(String(row.batting_strike_rate)) : null,
    ducks: (row.ducks as number) ?? 0,
    fifties: (row.fifties as number) ?? 0,
    hundreds: (row.hundreds as number) ?? 0,
    inningsBowled: (row.innings_bowled as number) ?? 0,
    ballsBowled: (row.balls_bowled as number) ?? 0,
    runsConceded: (row.runs_conceded as number) ?? 0,
    wickets: (row.wickets as number) ?? 0,
    maidens: (row.maidens as number) ?? 0,
    wides: (row.wides as number) ?? 0,
    noBalls: (row.no_balls as number) ?? 0,
    bowlingAverage: row.bowling_average != null ? parseFloat(String(row.bowling_average)) : null,
    economyRate: row.economy_rate != null ? parseFloat(String(row.economy_rate)) : null,
    bowlingStrikeRate: row.bowling_strike_rate != null ? parseFloat(String(row.bowling_strike_rate)) : null,
    bestBowlingWickets: (row.best_bowling_wickets as number) ?? 0,
    bestBowlingRuns: row.best_bowling_runs != null ? (row.best_bowling_runs as number) : null,
    catches: (row.catches as number) ?? 0,
    stumpings: (row.stumpings as number) ?? 0,
    runOuts: (row.run_outs as number) ?? 0,
    calculatedAt: row.calculated_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPlayerStatsWithPlayer(row: Record<string, unknown>): CricketPlayerStatsWithPlayer {
  return {
    ...rowToPlayerStats(row),
    playerName: (row.player_name as string) ?? "Unknown",
    playerSlug: (row.player_slug as string | null) ?? null,
    teamName: (row.team_name as string | null) ?? null,
    teamSlug: (row.team_slug as string | null) ?? null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichRows(data: Record<string, unknown>[]): CricketPlayerStatsWithPlayer[] {
  return data.map((row) => {
    const player = row.player as Record<string, unknown> | null;
    const team = row.team as Record<string, unknown> | null;
    return rowToPlayerStatsWithPlayer({
      ...row,
      player_name: player?.display_name ?? "Unknown",
      player_slug: player?.slug ?? null,
      team_name: team?.name ?? null,
      team_slug: team?.slug ?? null,
    } as Record<string, unknown>);
  });
}

const PLAYER_STATS_SELECT = `
  *,
  player:cricket_players!cricket_player_stats_player_id_fkey(display_name, slug),
  team:cricket_teams!cricket_player_stats_team_id_fkey(name, slug)
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketPlayerStatsForLeague(
  leagueId: string,
  filters?: { teamId?: string; limit?: number }
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("league_id", leagueId);

  if (filters?.teamId) query = query.eq("team_id", filters.teamId);

  const { data, error } = await query
    .order("runs", { ascending: false })
    .limit(filters?.limit ?? 200);

  if (error) {
    console.error("getCricketPlayerStatsForLeague error:", error.message);
    return [];
  }
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketPlayerStatsForTeam(
  teamId: string
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("team_id", teamId)
    .order("runs", { ascending: false });

  if (error) {
    console.error("getCricketPlayerStatsForTeam error:", error.message);
    return [];
  }
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketPlayerStats(
  playerId: string,
  leagueId?: string
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("player_id", playerId);

  if (leagueId) query = query.eq("league_id", leagueId);

  const { data, error } = await query.order("runs", { ascending: false });
  if (error) {
    console.error("getCricketPlayerStats error:", error.message);
    return [];
  }
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketBattingLeaderboard(
  leagueId: string,
  filters?: { teamId?: string; minInnings?: number; limit?: number }
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("league_id", leagueId)
    .gt("innings_batted", 0);

  if (filters?.teamId) query = query.eq("team_id", filters.teamId);
  if (filters?.minInnings) query = query.gte("innings_batted", filters.minInnings);

  const { data, error } = await query
    .order("runs", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (error) return [];
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketBowlingLeaderboard(
  leagueId: string,
  filters?: { teamId?: string; minBalls?: number; limit?: number }
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("league_id", leagueId)
    .gt("balls_bowled", 0);

  if (filters?.teamId) query = query.eq("team_id", filters.teamId);
  if (filters?.minBalls) query = query.gte("balls_bowled", filters.minBalls);

  const { data, error } = await query
    .order("wickets", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (error) return [];
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketFieldingLeaderboard(
  leagueId: string,
  filters?: { teamId?: string; limit?: number }
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("league_id", leagueId)
    .or("catches.gt.0,stumpings.gt.0,run_outs.gt.0");

  if (filters?.teamId) query = query.eq("team_id", filters.teamId);

  const { data, error } = await query
    .order("catches", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (error) return [];
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketAllRounderLeaderboard(
  leagueId: string,
  filters?: { teamId?: string; limit?: number }
): Promise<CricketPlayerStatsWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_player_stats")
    .select(PLAYER_STATS_SELECT)
    .eq("league_id", leagueId)
    .gt("innings_batted", 0)
    .gt("balls_bowled", 0);

  if (filters?.teamId) query = query.eq("team_id", filters.teamId);

  const { data, error } = await query
    .order("runs", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (error) return [];
  return enrichRows((data ?? []) as Record<string, unknown>[]);
}

export async function getCricketTeamStatsSummary(leagueId: string): Promise<{
  topRunScorer: CricketPlayerStatsWithPlayer | null;
  topWicketTaker: CricketPlayerStatsWithPlayer | null;
  bestEconomy: CricketPlayerStatsWithPlayer | null;
}> {
  const [batting, bowling, economy] = await Promise.all([
    getCricketBattingLeaderboard(leagueId, { limit: 1 }),
    getCricketBowlingLeaderboard(leagueId, { limit: 1 }),
    getCricketBowlingLeaderboard(leagueId, { limit: 50 }),
  ]);

  const economySorted = economy
    .filter((s) => s.economyRate !== null)
    .sort((a, b) => (a.economyRate ?? Infinity) - (b.economyRate ?? Infinity));

  return {
    topRunScorer: batting[0] ?? null,
    topWicketTaker: bowling[0] ?? null,
    bestEconomy: economySorted[0] ?? null,
  };
}
