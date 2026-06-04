/**
 * lib/cricket/players/queries.ts
 * Read-only data access for cricket players.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CricketPlayerFull } from "@/lib/cricket/types";
import { rowToTeamFull } from "@/lib/cricket/teams/queries";
import type { CricketTeamFull } from "@/lib/cricket/types";

// ─── Row → domain transform ───────────────────────────────────────────────────

export function rowToPlayerFull(row: Record<string, unknown>): CricketPlayerFull {
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

// ─── Query functions ───────────────────────────────────────────────────────────

/** Returns all players on a team's roster. */
export async function getCricketPlayersForTeam(
  teamId: string
): Promise<CricketPlayerFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_rosters")
    .select("cricket_players(*)")
    .eq("cricket_team_id", teamId);

  if (error) {
    console.error("[players/queries] getCricketPlayersForTeam:", error.message);
    return [];
  }

  return (data ?? [])
    .map((r) => {
      const row = r as unknown as { cricket_players: Record<string, unknown> | null };
      return row.cricket_players ? rowToPlayerFull(row.cricket_players) : null;
    })
    .filter((p): p is CricketPlayerFull => p !== null);
}

/** Returns a player by ID, or null. */
export async function getCricketPlayerById(
  playerId: string
): Promise<CricketPlayerFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[players/queries] getCricketPlayerById:", error.message);
    }
    return null;
  }

  return data ? rowToPlayerFull(data as Record<string, unknown>) : null;
}

/** Returns a player by slug, or null. */
export async function getCricketPlayerBySlug(
  slug: string
): Promise<CricketPlayerFull | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cricket_players")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[players/queries] getCricketPlayerBySlug:", error.message);
    }
    return null;
  }

  return data ? rowToPlayerFull(data as Record<string, unknown>) : null;
}

/** Returns all players in a league (via team rosters). */
export async function getCricketPlayersForLeague(
  leagueId: string
): Promise<CricketPlayerFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_teams")
    .select("id")
    .eq("league_id", leagueId);

  if (error || !data || data.length === 0) return [];

  const teamIds = data.map((r) => (r as { id: string }).id);

  const { data: rosterData, error: rosterError } = await supabase
    .from("cricket_team_rosters")
    .select("cricket_players(*)")
    .in("cricket_team_id", teamIds);

  if (rosterError) {
    console.error("[players/queries] getCricketPlayersForLeague:", rosterError.message);
    return [];
  }

  const seen = new Set<string>();
  return (rosterData ?? [])
    .map((r) => {
      const row = r as unknown as { cricket_players: Record<string, unknown> | null };
      return row.cricket_players ? rowToPlayerFull(row.cricket_players) : null;
    })
    .filter((p): p is CricketPlayerFull => {
      if (!p) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
}

/** Search players by display name. */
export async function searchCricketPlayers(
  query: string,
  limit = 20
): Promise<CricketPlayerFull[]> {
  if (!query.trim()) return [];

  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_players")
    .select("*")
    .ilike("display_name", `%${query}%`)
    .limit(limit)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("[players/queries] searchCricketPlayers:", error.message);
    return [];
  }

  return (data ?? []).map((r) => rowToPlayerFull(r as Record<string, unknown>));
}

/** Checks whether a player slug is already taken. Returns true if available. */
export async function isPlayerSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("cricket_players")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error?.code === "PGRST116") return true;
  if (error) return false;
  return !data;
}

/** Returns the teams a player belongs to. */
export async function getCricketTeamsForPlayer(
  playerId: string
): Promise<CricketTeamFull[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cricket_team_rosters")
    .select("cricket_teams(*)")
    .eq("cricket_player_id", playerId);

  if (error) {
    console.error("[players/queries] getCricketTeamsForPlayer:", error.message);
    return [];
  }

  return (data ?? [])
    .map((r) => {
      const row = r as unknown as { cricket_teams: Record<string, unknown> | null };
      return row.cricket_teams ? rowToTeamFull(row.cricket_teams) : null;
    })
    .filter((t): t is CricketTeamFull => t !== null);
}
