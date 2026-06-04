/**
 * lib/cricket/standings/queries.ts
 * Data access layer for cricket standings.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketTeamStanding,
  CricketTeamStandingWithTeam,
  CricketStandingsSnapshot,
  CricketMatchTeamResult,
  StandingsFormResult,
} from "@/lib/cricket/types";

// ─── Row transforms ───────────────────────────────────────────────────────────

function rowToStanding(row: Record<string, unknown>): CricketTeamStanding {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    teamId: row.team_id as string,
    matchesPlayed: (row.matches_played as number) ?? 0,
    wins: (row.wins as number) ?? 0,
    losses: (row.losses as number) ?? 0,
    ties: (row.ties as number) ?? 0,
    noResults: (row.no_results as number) ?? 0,
    abandoned: (row.abandoned as number) ?? 0,
    forfeitsFor: (row.forfeits_for as number) ?? 0,
    forfeitsAgainst: (row.forfeits_against as number) ?? 0,
    points: (row.points as number) ?? 0,
    bonusPoints: (row.bonus_points as number) ?? 0,
    totalPoints: (row.total_points as number) ?? 0,
    runsFor: (row.runs_for as number) ?? 0,
    ballsFor: (row.balls_for as number) ?? 0,
    runsAgainst: (row.runs_against as number) ?? 0,
    ballsAgainst: (row.balls_against as number) ?? 0,
    wicketsFor: (row.wickets_for as number) ?? 0,
    wicketsAgainst: (row.wickets_against as number) ?? 0,
    netRunRate: parseFloat(String(row.net_run_rate ?? "0")),
    position: (row.position as number | null) ?? null,
    previousPosition: (row.previous_position as number | null) ?? null,
    form: ((row.form as string[]) ?? []) as StandingsFormResult[],
    lastMatchId: (row.last_match_id as string | null) ?? null,
    calculatedAt: row.calculated_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToStandingWithTeam(row: Record<string, unknown>): CricketTeamStandingWithTeam {
  return {
    ...rowToStanding(row),
    teamName: row.team_name as string,
    teamShortName: (row.team_short_name as string | null) ?? null,
    teamSlug: row.team_slug as string,
    teamPrimaryColor: (row.team_primary_color as string | null) ?? null,
  };
}

function rowToSnapshot(row: Record<string, unknown>): CricketStandingsSnapshot {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    snapshotType: row.snapshot_type as string,
    generatedBy: (row.generated_by as string | null) ?? null,
    standings: (row.standings as unknown[]) ?? [],
    summary: (row.summary as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

function rowToMatchTeamResult(row: Record<string, unknown>): CricketMatchTeamResult {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: row.team_id as string,
    opponentTeamId: (row.opponent_team_id as string | null) ?? null,
    result: row.result as string,
    points: (row.points as number) ?? 0,
    bonusPoints: (row.bonus_points as number) ?? 0,
    runsFor: (row.runs_for as number) ?? 0,
    ballsFor: (row.balls_for as number) ?? 0,
    wicketsLost: (row.wickets_lost as number) ?? 0,
    runsAgainst: (row.runs_against as number) ?? 0,
    ballsAgainst: (row.balls_against as number) ?? 0,
    wicketsTaken: (row.wickets_taken as number) ?? 0,
    netRunRateDelta: parseFloat(String(row.net_run_rate_delta ?? "0")),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCricketLeagueStandings(
  leagueId: string
): Promise<CricketTeamStandingWithTeam[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_standings")
    .select(`
      *,
      team:cricket_teams!cricket_team_standings_team_id_fkey(
        name, short_name, slug, primary_color
      )
    `)
    .eq("league_id", leagueId)
    .order("position", { ascending: true, nullsFirst: false })
    .order("total_points", { ascending: false });

  if (error) {
    console.error("getCricketLeagueStandings error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const team = row.team as Record<string, unknown> | null;
    return rowToStandingWithTeam({
      ...row,
      team_name: team?.name ?? "Unknown",
      team_short_name: team?.short_name ?? null,
      team_slug: team?.slug ?? "",
      team_primary_color: team?.primary_color ?? null,
    } as Record<string, unknown>);
  });
}

export async function getCricketLeagueStandingsBySlug(
  slug: string
): Promise<CricketTeamStandingWithTeam[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: league } = await supabase
    .from("cricket_leagues")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!league) return [];
  return getCricketLeagueStandings(league.id);
}

export async function getCricketTeamStanding(
  leagueId: string,
  teamId: string
): Promise<CricketTeamStandingWithTeam | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_team_standings")
    .select(`
      *,
      team:cricket_teams!cricket_team_standings_team_id_fkey(
        name, short_name, slug, primary_color
      )
    `)
    .eq("league_id", leagueId)
    .eq("team_id", teamId)
    .single();

  if (error || !data) return null;

  const team = data.team as Record<string, unknown> | null;
  return rowToStandingWithTeam({
    ...data,
    team_name: team?.name ?? "Unknown",
    team_short_name: team?.short_name ?? null,
    team_slug: team?.slug ?? "",
    team_primary_color: team?.primary_color ?? null,
  } as Record<string, unknown>);
}

export async function getCricketMatchTeamResults(
  matchId: string
): Promise<CricketMatchTeamResult[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_match_team_results")
    .select("*")
    .eq("match_id", matchId);

  if (error) {
    console.error("getCricketMatchTeamResults error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToMatchTeamResult(r as Record<string, unknown>));
}

export async function getLatestStandingsSnapshot(
  leagueId: string
): Promise<CricketStandingsSnapshot | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_standings_snapshots")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return rowToSnapshot(data as Record<string, unknown>);
}

export async function getStandingsRebuildSummary(leagueId: string): Promise<{
  leagueId: string;
  standingsCount: number;
  lastCalculatedAt: string | null;
  snapshotCount: number;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { leagueId, standingsCount: 0, lastCalculatedAt: null, snapshotCount: 0 };
  }

  const [standingsRes, snapshotRes] = await Promise.all([
    supabase
      .from("cricket_team_standings")
      .select("calculated_at")
      .eq("league_id", leagueId)
      .order("calculated_at", { ascending: false }),
    supabase
      .from("cricket_standings_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("league_id", leagueId),
  ]);

  const standings = standingsRes.data ?? [];
  return {
    leagueId,
    standingsCount: standings.length,
    lastCalculatedAt: (standings[0] as Record<string, unknown> | undefined)?.calculated_at as string | null ?? null,
    snapshotCount: snapshotRes.count ?? 0,
  };
}
