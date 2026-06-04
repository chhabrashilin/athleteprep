/**
 * lib/cricket/leagues/queries.ts
 * Data access layer for cricket league admin features.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketLeagueFull,
  CricketLeagueSettings,
  CricketLeagueMember,
  CricketLeagueInvitation,
} from "@/lib/cricket/types";

// ─── Row → domain model transforms ────────────────────────────────────────────

function rowToLeagueFull(row: Record<string, unknown>): CricketLeagueFull {
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
    // Admin columns (from migration 0015)
    visibility: (row.visibility as string) ?? "private",
    registrationStatus: (row.registration_status as string) ?? "draft",
    timezone: (row.timezone as string) ?? "America/New_York",
    ballType: (row.ball_type as string | null) ?? null,
    matchDays: (row.match_days as string[]) ?? [],
    rulesSummary: (row.rules_summary as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    allowPublicScorecards: (row.allow_public_scorecards as boolean) ?? false,
    allowTeamRegistration: (row.allow_team_registration as boolean) ?? false,
    allowPlayerRegistration: (row.allow_player_registration as boolean) ?? false,
    requireAdminApproval: (row.require_admin_approval as boolean) ?? true,
  };
}

function rowToSettings(row: Record<string, unknown>): CricketLeagueSettings {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    scoringMode: (row.scoring_mode as string) ?? "standard",
    defaultOvers: row.default_overs as number,
    maxPlayersPerTeam: (row.max_players_per_team as number | null) ?? null,
    minPlayersPerTeam: (row.min_players_per_team as number | null) ?? null,
    allowSubstitutes: (row.allow_substitutes as boolean) ?? true,
    allowSuperOver: (row.allow_super_over as boolean) ?? true,
    allowDuckworthLewis: (row.allow_duckworth_lewis as boolean) ?? false,
    pointsWin: row.points_win as number,
    pointsLoss: row.points_loss as number,
    pointsTie: row.points_tie as number,
    pointsNoResult: row.points_no_result as number,
    netRunRateEnabled: (row.net_run_rate_enabled as boolean) ?? true,
    bonusPointsEnabled: (row.bonus_points_enabled as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMember(row: Record<string, unknown>): CricketLeagueMember {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    userId: row.user_id as string,
    role: row.role as string,
    createdAt: row.created_at as string,
  };
}

function rowToInvitation(row: Record<string, unknown>): CricketLeagueInvitation {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    email: row.email as string,
    role: row.role as string,
    status: row.status as string,
    invitedBy: (row.invited_by as string | null) ?? null,
    invitedAt: row.invited_at as string,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    token: (row.token as string | null) ?? null,
  };
}

// ─── Query functions ───────────────────────────────────────────────────────────

/** Returns all leagues where the user is a member (owner, admin, manager, etc.). */
export async function getCricketLeaguesForUser(
  userId: string
): Promise<CricketLeagueFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_league_members")
    .select("league_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[league/queries] getCricketLeaguesForUser members:", error.message);
    return [];
  }

  const leagueIds = (data ?? []).map((r) => r.league_id as string);
  if (leagueIds.length === 0) return [];

  const { data: leagues, error: leagueError } = await supabase
    .from("cricket_leagues")
    .select("*")
    .in("id", leagueIds)
    .order("created_at", { ascending: false });

  if (leagueError) {
    console.error("[league/queries] getCricketLeaguesForUser leagues:", leagueError.message);
    return [];
  }

  return (leagues ?? []).map((r) => rowToLeagueFull(r as Record<string, unknown>));
}

/** Returns a single full league by slug, or null if not found. */
export async function getCricketLeagueBySlugFull(
  slug: string
): Promise<CricketLeagueFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_leagues")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[league/queries] getCricketLeagueBySlugFull:", error.message);
    }
    return null;
  }

  return data ? rowToLeagueFull(data as Record<string, unknown>) : null;
}

/** Returns a single full league by id, or null if not found. */
export async function getCricketLeagueById(
  id: string
): Promise<CricketLeagueFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_leagues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[league/queries] getCricketLeagueById:", error.message);
    }
    return null;
  }

  return data ? rowToLeagueFull(data as Record<string, unknown>) : null;
}

/** Returns the settings record for a league, or null if not yet created. */
export async function getCricketLeagueSettings(
  leagueId: string
): Promise<CricketLeagueSettings | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_league_settings")
    .select("*")
    .eq("league_id", leagueId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[league/queries] getCricketLeagueSettings:", error.message);
    }
    return null;
  }

  return data ? rowToSettings(data as Record<string, unknown>) : null;
}

/** Returns all members of a league ordered by role then join date. */
export async function getCricketLeagueMembers(
  leagueId: string
): Promise<CricketLeagueMember[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_league_members")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[league/queries] getCricketLeagueMembers:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToMember(r as Record<string, unknown>));
}

/** Returns active (pending) invitations for a league. */
export async function getCricketLeagueInvitations(
  leagueId: string
): Promise<CricketLeagueInvitation[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_league_invitations")
    .select("*")
    .eq("league_id", leagueId)
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("[league/queries] getCricketLeagueInvitations:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToInvitation(r as Record<string, unknown>));
}

/**
 * Returns true if the given user can manage (update settings, invite members,
 * etc.) the given league. Checks: creator OR owner/admin member role.
 */
export async function userCanManageCricketLeague(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("cricket_league_members")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .single();

  if (!error && data) return true;

  // Fall back to checking created_by on the league itself
  const { data: leagueRow, error: leagueError } = await supabase
    .from("cricket_leagues")
    .select("created_by")
    .eq("id", leagueId)
    .single();

  if (leagueError) return false;
  return (leagueRow as Record<string, unknown>)?.created_by === userId;
}

/** Checks whether a slug is already taken. Returns true if available. */
export async function isLeagueSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("cricket_leagues")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") return true; // no rows = available
  if (error) return false;
  return !data;
}
