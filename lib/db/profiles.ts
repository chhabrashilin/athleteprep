/**
 * lib/db/profiles.ts — User profile data access.
 * Uses the server Supabase client — call only from Server Components,
 * Server Actions, or Route Handlers.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { ProfileRow } from "@/lib/supabase/types";

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    email: row.email,
    defaultTeamId: row.default_team_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Returns the profile for the currently authenticated user.
 * Returns null if unauthenticated or Supabase is not configured.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return rowToProfile(data);
}

/**
 * Ensures a profile row exists for the current user.
 * Performs a select first; if no row exists, inserts one.
 * Safe to call even if the DB trigger already created the row.
 * Returns the profile, or null if unauthenticated.
 */
export async function ensureCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if the profile already exists (trigger may have created it).
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) return rowToProfile(existing);

  // Profile not found — insert as a fallback.
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ?? null,
    })
    .select()
    .single();

  if (error || !created) return null;
  return rowToProfile(created);
}

/** Returns a profile by user ID. */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return rowToProfile(data);
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  defaultTeamId?: string | null;
}

/**
 * Updates the currently authenticated user's profile.
 * Returns the updated profile or null on failure.
 */
export async function updateCurrentUserProfile(
  input: UpdateProfileInput
): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Build a typed update payload using only the ProfileRow columns.
  const patch: Partial<ProfileRow> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  if (input.defaultTeamId !== undefined) patch.default_team_id = input.defaultTeamId;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) return null;
  return rowToProfile(data);
}
