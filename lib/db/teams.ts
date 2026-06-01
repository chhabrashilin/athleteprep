/**
 * lib/db/teams.ts — Team and team membership data access.
 * All functions use the authenticated server Supabase client.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateSlug, generateSlugWithSuffix } from "@/lib/utils/slug";
import type { Team, TeamMember } from "@/types/database";
import type { SportType } from "@/types/sports";
import type { TeamRole } from "@/types/core";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateTeamInput {
  name: string;
  sport: SportType;
  organizationName?: string;
  level?: string;
  location?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Internal row → domain model transforms
// ---------------------------------------------------------------------------

function rowToTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string | null) ?? null,
    sport: row.sport as SportType,
    organizationName: (row.organization_name as string | null) ?? null,
    level: (row.level as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    userId: (row.user_id as string | null) ?? null,
    role: row.role as TeamRole,
    invitedEmail: (row.invited_email as string | null) ?? null,
    joinedAt: (row.joined_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Public data access functions
// ---------------------------------------------------------------------------

/**
 * Returns all teams the current authenticated user belongs to,
 * ordered by most recently created.
 * Returns an empty array if Supabase is not configured or user is unauthenticated.
 */
export async function getTeamsForCurrentUser(): Promise<Team[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Query through team_members so RLS on both tables is naturally satisfied.
  // The user can see their own team_members rows (user_id = auth.uid()),
  // and the joined teams pass the is_team_member check because membership exists.
  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      id,
      team_id,
      user_id,
      role,
      invited_email,
      joined_at,
      created_at,
      updated_at,
      teams (
        id,
        name,
        slug,
        sport,
        organization_name,
        level,
        location,
        description,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTeamsForCurrentUser error:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.teams !== null)
    .map((row) => rowToTeam(row.teams as unknown as Record<string, unknown>));
}

/**
 * Returns teams along with the user's membership role.
 * Useful for rendering team lists where role context is needed.
 */
export interface TeamWithMembership {
  team: Team;
  membership: TeamMember;
}

export async function getTeamsWithMembershipForCurrentUser(): Promise<
  TeamWithMembership[]
> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("team_members")
    .select(
      `
      id,
      team_id,
      user_id,
      role,
      invited_email,
      joined_at,
      created_at,
      updated_at,
      teams (
        id,
        name,
        slug,
        sport,
        organization_name,
        level,
        location,
        description,
        created_by,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTeamsWithMembershipForCurrentUser error:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.teams !== null)
    .map((row) => ({
      team: rowToTeam(row.teams as unknown as Record<string, unknown>),
      membership: rowToMember({
        id: row.id,
        team_id: row.team_id,
        user_id: row.user_id,
        role: row.role,
        invited_email: row.invited_email,
        joined_at: row.joined_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    }));
}

/**
 * Returns a single team by ID if the current user is a member.
 * Returns null if not found, not a member, or Supabase not configured.
 * The teams_select_member RLS policy enforces membership automatically.
 */
export async function getTeamByIdForCurrentUser(
  teamId: string
): Promise<Team | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error || !data) return null;
  return rowToTeam(data as Record<string, unknown>);
}

/**
 * Returns the current user's membership record for a given team.
 * Returns null if the user is not a member or Supabase is not configured.
 */
export async function getCurrentUserTeamMembership(
  teamId: string
): Promise<TeamMember | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return rowToMember(data as Record<string, unknown>);
}

/**
 * Creates a new team and adds the current user as owner.
 * Uses the create_team_with_owner RPC (SECURITY DEFINER) to atomically
 * bypass the team_members INSERT policy which would otherwise block the
 * initial owner row before any membership exists.
 *
 * On success, returns the new team ID.
 * Throws on failure so the caller can surface a user-facing error.
 */
export async function createTeamForCurrentUser(
  input: CreateTeamInput
): Promise<string> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database is not configured. Check your environment variables.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to create a team.");
  }

  // Attempt slug, fall back to slug-with-suffix if uniqueness fails.
  const baseSlug = generateSlug(input.name);

  const { data: teamId, error } = await supabase.rpc(
    "create_team_with_owner",
    {
      p_name: input.name.trim(),
      p_sport: input.sport,
      p_slug: baseSlug || null,
      p_organization_name: input.organizationName?.trim() || null,
      p_level: input.level?.trim() || null,
      p_location: input.location?.trim() || null,
      p_description: input.description?.trim() || null,
    }
  );

  // If slug uniqueness constraint fires, retry with a suffix.
  if (error && error.message.includes("teams_slug_key")) {
    const fallbackSlug = generateSlugWithSuffix(input.name);
    const { data: retryId, error: retryError } = await supabase.rpc(
      "create_team_with_owner",
      {
        p_name: input.name.trim(),
        p_sport: input.sport,
        p_slug: fallbackSlug,
        p_organization_name: input.organizationName?.trim() || null,
        p_level: input.level?.trim() || null,
        p_location: input.location?.trim() || null,
        p_description: input.description?.trim() || null,
      }
    );
    if (retryError || !retryId) {
      throw new Error(retryError?.message ?? "Failed to create team. Please try again.");
    }
    return retryId as string;
  }

  if (error || !teamId) {
    throw new Error(error?.message ?? "Failed to create team. Please try again.");
  }

  return teamId as string;
}
