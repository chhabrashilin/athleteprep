/**
 * lib/cricket/queries.ts — Data access layer for cricket foundation tables.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketLeague,
  CricketMatch,
  CricketPlayer,
  CricketTeam,
} from "./types";

// ─── Row → domain model transforms ────────────────────────────────────────────

function rowToLeague(row: Record<string, unknown>): CricketLeague {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    seasonName: (row.season_name as string | null) ?? null,
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    format: row.format as string,
    oversPerInnings: row.overs_per_innings as number,
    maxTeams: (row.max_teams as number | null) ?? null,
    pointsWin: row.points_win as number,
    pointsLoss: row.points_loss as number,
    pointsTie: row.points_tie as number,
    pointsNoResult: row.points_no_result as number,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToTeam(row: Record<string, unknown>): CricketTeam {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    existingTeamId: (row.existing_team_id as string | null) ?? null,
    name: row.name as string,
    shortName: (row.short_name as string | null) ?? null,
    slug: row.slug as string,
    logoUrl: (row.logo_url as string | null) ?? null,
    primaryColor: (row.primary_color as string | null) ?? null,
    secondaryColor: (row.secondary_color as string | null) ?? null,
    homeGround: (row.home_ground as string | null) ?? null,
    managerName: (row.manager_name as string | null) ?? null,
    managerEmail: (row.manager_email as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPlayer(row: Record<string, unknown>): CricketPlayer {
  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    displayName: row.display_name as string,
    slug: (row.slug as string | null) ?? null,
    battingStyle: (row.batting_style as string | null) ?? null,
    bowlingStyle: (row.bowling_style as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    profilePhotoUrl: (row.profile_photo_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMatch(row: Record<string, unknown>): CricketMatch {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    homeTeamId: (row.home_team_id as string | null) ?? null,
    awayTeamId: (row.away_team_id as string | null) ?? null,
    venueId: (row.venue_id as string | null) ?? null,
    matchType: row.match_type as string,
    matchStatus: row.match_status as CricketMatch["matchStatus"],
    scheduledStart: (row.scheduled_start as string | null) ?? null,
    oversPerInnings: row.overs_per_innings as number,
    tossWinnerTeamId: (row.toss_winner_team_id as string | null) ?? null,
    tossDecision: (row.toss_decision as string | null) ?? null,
    winnerTeamId: (row.winner_team_id as string | null) ?? null,
    resultSummary: (row.result_summary as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Public query functions ────────────────────────────────────────────────────

/** Returns all cricket leagues ordered by creation date, newest first. */
export async function getCricketLeagues(): Promise<CricketLeague[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_leagues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[cricket/queries] getCricketLeagues:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToLeague(r as Record<string, unknown>));
}

/** Returns a single cricket league by slug, or null if not found. */
export async function getCricketLeagueBySlug(
  slug: string
): Promise<CricketLeague | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = no rows — that is not an error worth logging
      console.error("[cricket/queries] getCricketLeagueBySlug:", error.message);
    }
    return null;
  }
  return data ? rowToLeague(data as Record<string, unknown>) : null;
}

/** Returns all cricket teams across all leagues. */
export async function getCricketTeams(): Promise<CricketTeam[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[cricket/queries] getCricketTeams:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToTeam(r as Record<string, unknown>));
}

/** Returns all cricket teams belonging to a league. */
export async function getCricketTeamsByLeague(
  leagueId: string
): Promise<CricketTeam[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .eq("league_id", leagueId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[cricket/queries] getCricketTeamsByLeague:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToTeam(r as Record<string, unknown>));
}

/** Returns all cricket players ordered alphabetically by display name. */
export async function getCricketPlayers(): Promise<CricketPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_players")
    .select("*")
    .order("display_name", { ascending: true });

  if (error) {
    console.error("[cricket/queries] getCricketPlayers:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToPlayer(r as Record<string, unknown>));
}

/** Returns all matches for a league ordered by scheduled start time. */
export async function getCricketMatchesByLeague(
  leagueId: string
): Promise<CricketMatch[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("league_id", leagueId)
    .order("scheduled_start", { ascending: true });

  if (error) {
    console.error("[cricket/queries] getCricketMatchesByLeague:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToMatch(r as Record<string, unknown>));
}

/**
 * Returns upcoming scheduled matches across all leagues,
 * ordered by scheduled start time, newest first up to `limit`.
 */
export async function getUpcomingCricketMatches(
  limit = 10
): Promise<CricketMatch[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_matches")
    .select("*")
    .eq("match_status", "scheduled")
    .gte("scheduled_start", new Date().toISOString())
    .order("scheduled_start", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[cricket/queries] getUpcomingCricketMatches:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToMatch(r as Record<string, unknown>));
}
