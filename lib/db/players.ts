/**
 * lib/db/players.ts — Player/roster data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Player } from "@/types/database";
import type { PlayerStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreatePlayerInput {
  teamId: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  jerseyNumber?: string;
  position?: string;
  role?: string;
  dominantSide?: string;
  classYear?: string;
  height?: string;
  weight?: string;
  status?: PlayerStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlayerInput {
  playerId: string;
  teamId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jerseyNumber?: string;
  position?: string;
  role?: string;
  dominantSide?: string;
  classYear?: string;
  height?: string;
  weight?: string;
  status?: PlayerStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal transform
// ---------------------------------------------------------------------------

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    userId: (row.user_id as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: (row.last_name as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    jerseyNumber: (row.jersey_number as string | null) ?? null,
    position: (row.position as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    dominantSide: (row.dominant_side as string | null) ?? null,
    classYear: (row.class_year as string | null) ?? null,
    height: (row.height as string | null) ?? null,
    weight: (row.weight as string | null) ?? null,
    status: (row.status as PlayerStatus) ?? "active",
    notes: (row.notes as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Derives a display name from first + last name when none is set explicitly. */
export function deriveDisplayName(
  firstName: string,
  lastName?: string | null,
  displayName?: string | null
): string {
  if (displayName?.trim()) return displayName.trim();
  return [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Returns all players for a team.
 * By default excludes archived players; pass `includeArchived: true` to include them.
 * RLS ensures the caller is a team member.
 */
export async function getPlayersForTeam(
  teamId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<Player[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("first_name", { ascending: true });

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPlayersForTeam error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToPlayer(row as Record<string, unknown>));
}

/**
 * Returns a single player by ID, scoped to the given team.
 * Returns null if not found or not authorized (RLS).
 */
export async function getPlayerByIdForTeam(
  teamId: string,
  playerId: string
): Promise<Player | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("team_id", teamId)
    .single();

  if (error || !data) return null;
  return rowToPlayer(data as Record<string, unknown>);
}

/**
 * Returns active + total player counts for a team.
 * Returns { total: 0, active: 0 } when Supabase is not configured.
 */
export async function getTeamPlayerCount(
  teamId: string
): Promise<{ total: number; active: number }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { total: 0, active: 0 };

  const { data, error } = await supabase
    .from("players")
    .select("status")
    .eq("team_id", teamId)
    .neq("status", "archived");

  if (error || !data) return { total: 0, active: 0 };

  const total = data.length;
  const active = data.filter((r) => r.status === "active").length;
  return { total, active };
}

/**
 * Returns player counts for multiple teams in one query.
 * Returns a map of teamId → { total, active } (only non-archived players).
 */
export async function getPlayerCountsForTeams(
  teamIds: string[]
): Promise<Record<string, { total: number; active: number }>> {
  if (teamIds.length === 0) return {};

  const supabase = await createServerSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("players")
    .select("team_id, status")
    .in("team_id", teamIds)
    .neq("status", "archived");

  if (error || !data) return {};

  const counts: Record<string, { total: number; active: number }> = {};
  for (const row of data) {
    const tid = row.team_id as string;
    if (!counts[tid]) counts[tid] = { total: 0, active: 0 };
    counts[tid].total++;
    if (row.status === "active") counts[tid].active++;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Write functions
// Authorization is enforced by Supabase RLS (is_team_staff for INSERT/UPDATE,
// is_team_manager for DELETE). The app layer verifies authentication only.
// ---------------------------------------------------------------------------

/**
 * Creates a new player on the team.
 * Requires the caller to be a team staff member (owner/coach/analyst) — enforced by RLS.
 * Throws on failure.
 */
export async function createPlayerForTeam(input: CreatePlayerInput): Promise<Player> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to add a player.");

  const displayName = deriveDisplayName(
    input.firstName,
    input.lastName,
    input.displayName
  );

  const { data, error } = await supabase
    .from("players")
    .insert({
      team_id: input.teamId,
      first_name: input.firstName.trim(),
      last_name: input.lastName?.trim() || null,
      display_name: displayName,
      jersey_number: input.jerseyNumber?.trim() || null,
      position: input.position?.trim() || null,
      role: input.role?.trim() || null,
      dominant_side: input.dominantSide?.trim() || null,
      class_year: input.classYear?.trim() || null,
      height: input.height?.trim() || null,
      weight: input.weight?.trim() || null,
      status: input.status ?? "active",
      notes: input.notes?.trim() || null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add player. Please try again.");
  }

  return rowToPlayer(data as Record<string, unknown>);
}

/**
 * Updates an existing player.
 * Requires the caller to be a team staff member (owner/coach/analyst) — enforced by RLS.
 * Throws on failure.
 */
export async function updatePlayerForTeam(input: UpdatePlayerInput): Promise<Player> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to edit a player.");

  // Build the patch — only include provided fields.
  const patch: Record<string, unknown> = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName.trim();
  if (input.lastName !== undefined)
    patch.last_name = input.lastName?.trim() || null;
  if (input.jerseyNumber !== undefined)
    patch.jersey_number = input.jerseyNumber?.trim() || null;
  if (input.position !== undefined)
    patch.position = input.position?.trim() || null;
  if (input.role !== undefined) patch.role = input.role?.trim() || null;
  if (input.dominantSide !== undefined)
    patch.dominant_side = input.dominantSide?.trim() || null;
  if (input.classYear !== undefined)
    patch.class_year = input.classYear?.trim() || null;
  if (input.height !== undefined) patch.height = input.height?.trim() || null;
  if (input.weight !== undefined) patch.weight = input.weight?.trim() || null;
  if (input.status !== undefined) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  // Recompute display_name whenever first/last/display changes.
  if (
    input.firstName !== undefined ||
    input.lastName !== undefined ||
    input.displayName !== undefined
  ) {
    // We need the current player to derive display_name if only one part changed.
    // Simplest approach: fetch and merge.
    const current = await getPlayerByIdForTeam(input.teamId, input.playerId);
    const resolvedFirst =
      (patch.first_name as string | undefined) ?? current?.firstName ?? "";
    const resolvedLast =
      (patch.last_name as string | null | undefined) ?? current?.lastName ?? null;
    const resolvedDisplay =
      input.displayName !== undefined ? input.displayName : current?.displayName;
    patch.display_name = deriveDisplayName(resolvedFirst, resolvedLast, resolvedDisplay);
  }

  const { data, error } = await supabase
    .from("players")
    .update(patch)
    .eq("id", input.playerId)
    .eq("team_id", input.teamId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update player. Please try again.");
  }

  return rowToPlayer(data as Record<string, unknown>);
}

/**
 * Sets a player's status to 'archived'.
 * Requires staff role — enforced by RLS (UPDATE on players needs is_team_staff).
 * Throws on failure.
 */
export async function archivePlayerForTeam(
  teamId: string,
  playerId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to archive a player.");

  const { error } = await supabase
    .from("players")
    .update({ status: "archived" })
    .eq("id", playerId)
    .eq("team_id", teamId);

  if (error) {
    throw new Error(error.message ?? "Failed to archive player. Please try again.");
  }
}

/**
 * Permanently deletes a player record.
 * Requires team manager role (owner/coach) — enforced by RLS (DELETE on players needs is_team_manager).
 * Throws on failure.
 */
export async function deletePlayerForTeam(
  teamId: string,
  playerId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to delete a player.");

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("team_id", teamId);

  if (error) {
    throw new Error(error.message ?? "Failed to delete player. Please try again.");
  }
}
