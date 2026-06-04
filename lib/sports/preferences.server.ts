/**
 * lib/sports/preferences.server.ts — Server-only sport preference DB helpers.
 *
 * Import ONLY from Server Components, Server Actions, and Route Handlers.
 * Never import this file in "use client" components — it uses next/headers
 * via createServerSupabaseClient.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidSportSlug } from "@/lib/sports/preferences";
import type { SportSlug } from "@/lib/sports/registry";

/** Reads the user's persisted sport preference from Supabase. Returns null if unavailable. */
export async function getUserSportPreference(userId: string): Promise<SportSlug | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_sport_preferences")
    .select("selected_sport")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  const slug = (data as Record<string, unknown>).selected_sport as string;
  return isValidSportSlug(slug) ? slug : null;
}

interface UpsertOptions {
  markOnboardingCompleted?: boolean;
  markCricketOnboardingCompleted?: boolean;
}

/** Upserts the user's sport preference row. Returns any error encountered. */
export async function upsertUserSportPreference(
  userId: string,
  sportSlug: SportSlug,
  options: UpsertOptions = {}
): Promise<{ error: Error | null }> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: new Error("Database not available") };

  const payload: Record<string, unknown> = {
    user_id: userId,
    selected_sport: sportSlug,
  };
  if (options.markOnboardingCompleted) payload.onboarding_completed = true;
  if (options.markCricketOnboardingCompleted) payload.cricket_onboarding_completed = true;

  const { error } = await supabase
    .from("user_sport_preferences")
    .upsert(payload, { onConflict: "user_id" });

  return { error: error ? new Error(error.message) : null };
}
