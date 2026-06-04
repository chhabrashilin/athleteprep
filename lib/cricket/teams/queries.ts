/**
 * lib/cricket/teams/queries.ts
 * Read-only data access for cricket teams, rosters, and team members.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CricketTeamFull,
  CricketTeamMember,
  CricketTeamInvitation,
  CricketRosterEntry,
  CricketRosterEntryWithPlayer,
  CricketPlayerFull,
} from "@/lib/cricket/types";

// ─── Row → domain transforms ──────────────────────────────────────────────────

export function rowToTeamFull(row: Record<string, unknown>): CricketTeamFull {
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
    // 0016 columns
    registrationStatus: (row.registration_status as string) ?? "draft",
    approvalStatus: (row.approval_status as string) ?? "approved",
    teamType: (row.team_type as string) ?? "club",
    description: (row.description as string | null) ?? null,
    foundedYear: (row.founded_year as number | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    instagramUrl: (row.instagram_url as string | null) ?? null,
    captainPlayerId: (row.captain_player_id as string | null) ?? null,
    viceCaptainPlayerId: (row.vice_captain_player_id as string | null) ?? null,
    coachName: (row.coach_name as string | null) ?? null,
    scorerName: (row.scorer_name as string | null) ?? null,
    isActive: (row.is_active as boolean) ?? true,
    archivedAt: (row.archived_at as string | null) ?? null,
  };
}

function rowToTeamMember(row: Record<string, unknown>): CricketTeamMember {
  return {
    id: row.id as string,
    cricketTeamId: row.cricket_team_id as string,
    userId: row.user_id as string,
    role: row.role as string,
    invitedBy: (row.invited_by as string | null) ?? null,
    joinedAt: row.joined_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToInvitation(row: Record<string, unknown>): CricketTeamInvitation {
  return {
    id: row.id as string,
    cricketTeamId: row.cricket_team_id as string,
    email: row.email as string,
    role: row.role as string,
    status: row.status as string,
    invitedBy: (row.invited_by as string | null) ?? null,
    token: (row.token as string | null) ?? null,
    invitedAt: row.invited_at as string,
    acceptedAt: (row.accepted_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
  };
}

function rowToPlayerFull(row: Record<string, unknown>): CricketPlayerFull {
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
    // 0016 columns
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    emergencyContactName: (row.emergency_contact_name as string | null) ?? null,
    emergencyContactPhone: (row.emergency_contact_phone as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    dominantHand: (row.dominant_hand as string | null) ?? null,
    primaryRole: (row.primary_role as string | null) ?? null,
    secondaryRole: (row.secondary_role as string | null) ?? null,
    battingOrderPreference: (row.batting_order_preference as number | null) ?? null,
    bowlingType: (row.bowling_type as string | null) ?? null,
    fieldingPositionPreference: (row.fielding_position_preference as string | null) ?? null,
    availabilityStatus: (row.availability_status as string) ?? "active",
    isVerified: (row.is_verified as boolean) ?? false,
  };
}

function rowToRosterEntry(row: Record<string, unknown>): CricketRosterEntry {
  return {
    id: row.id as string,
    cricketTeamId: row.cricket_team_id as string,
    cricketPlayerId: row.cricket_player_id as string,
    jerseyNumber: (row.jersey_number as string | null) ?? null,
    rosterRole: (row.roster_role as string | null) ?? null,
    isCaptain: (row.is_captain as boolean) ?? false,
    isViceCaptain: (row.is_vice_captain as boolean) ?? false,
    joinedAt: row.joined_at as string,
  };
}

// ─── Query functions ───────────────────────────────────────────────────────────

/** Returns all active teams for a league, ordered by name. */
export async function getCricketTeamsForLeague(
  leagueId: string
): Promise<CricketTeamFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .eq("league_id", leagueId)
    .order("name", { ascending: true });

  if (error) {
    console.error("[teams/queries] getCricketTeamsForLeague:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToTeamFull(r as Record<string, unknown>));
}

/** Returns a single team by slug, or null. */
export async function getCricketTeamBySlug(
  slug: string
): Promise<CricketTeamFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[teams/queries] getCricketTeamBySlug:", error.message);
    }
    return null;
  }

  return data ? rowToTeamFull(data as Record<string, unknown>) : null;
}

/** Returns a single team by ID, or null. */
export async function getCricketTeamById(
  teamId: string
): Promise<CricketTeamFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[teams/queries] getCricketTeamById:", error.message);
    }
    return null;
  }

  return data ? rowToTeamFull(data as Record<string, unknown>) : null;
}

/** Returns all teams where user is a member. */
export async function getCricketTeamsForUser(
  userId: string
): Promise<CricketTeamFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data: memberRows, error: memberError } = await supabase
    .from("cricket_team_members")
    .select("cricket_team_id")
    .eq("user_id", userId);

  if (memberError) {
    console.error("[teams/queries] getCricketTeamsForUser members:", memberError.message);
    return [];
  }

  const teamIds = (memberRows ?? []).map((r) => r.cricket_team_id as string);
  if (teamIds.length === 0) return [];

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("*")
    .in("id", teamIds)
    .order("name", { ascending: true });

  if (error) {
    console.error("[teams/queries] getCricketTeamsForUser teams:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToTeamFull(r as Record<string, unknown>));
}

/** Returns all members of a team. */
export async function getCricketTeamMembers(
  teamId: string
): Promise<CricketTeamMember[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_members")
    .select("*")
    .eq("cricket_team_id", teamId)
    .order("joined_at", { ascending: true });

  if (error) {
    console.error("[teams/queries] getCricketTeamMembers:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToTeamMember(r as Record<string, unknown>));
}

/** Returns active invitations for a team. */
export async function getCricketTeamInvitations(
  teamId: string
): Promise<CricketTeamInvitation[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_invitations")
    .select("*")
    .eq("cricket_team_id", teamId)
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("[teams/queries] getCricketTeamInvitations:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToInvitation(r as Record<string, unknown>));
}

/**
 * Returns true if the user can manage (edit, roster-manage) the team.
 * Checks: team member (owner/manager/coach), team creator, or league admin/owner.
 */
export async function userCanManageCricketTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  // Direct team role
  const { data: memberRow } = await supabase
    .from("cricket_team_members")
    .select("role")
    .eq("cricket_team_id", teamId)
    .eq("user_id", userId)
    .in("role", ["owner", "manager", "coach"])
    .single();

  if (memberRow) return true;

  // Creator
  const { data: teamRow } = await supabase
    .from("cricket_teams")
    .select("created_by, league_id")
    .eq("id", teamId)
    .single();

  if (!teamRow) return false;
  const team = teamRow as { created_by: string | null; league_id: string | null };

  if (team.created_by === userId) return true;

  // League admin/owner
  if (team.league_id) {
    const { data: leagueMemberRow } = await supabase
      .from("cricket_league_members")
      .select("role")
      .eq("league_id", team.league_id)
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .single();

    if (leagueMemberRow) return true;
  }

  return false;
}

/** Checks whether a team slug is already taken. Returns true if available. */
export async function isTeamSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") return true;
  if (error) return false;
  return !data;
}

// ─── Roster queries ───────────────────────────────────────────────────────────

/** Returns the full roster for a team, with player data joined. */
export async function getCricketTeamRoster(
  teamId: string
): Promise<CricketRosterEntryWithPlayer[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_rosters")
    .select("*, cricket_players(*)")
    .eq("cricket_team_id", teamId)
    .order("is_captain", { ascending: false })
    .order("is_vice_captain", { ascending: false })
    .order("jersey_number", { ascending: true });

  if (error) {
    console.error("[teams/queries] getCricketTeamRoster:", error.message);
    return [];
  }

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const playerRow = row.cricket_players as Record<string, unknown>;
    return {
      ...rowToRosterEntry(row),
      player: rowToPlayerFull(playerRow),
    };
  });
}

/** Returns a single roster entry for a team+player pair, or null. */
export async function getCricketRosterEntry(
  teamId: string,
  playerId: string
): Promise<CricketRosterEntry | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_team_rosters")
    .select("*")
    .eq("cricket_team_id", teamId)
    .eq("cricket_player_id", playerId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[teams/queries] getCricketRosterEntry:", error.message);
    }
    return null;
  }

  return data ? rowToRosterEntry(data as Record<string, unknown>) : null;
}
