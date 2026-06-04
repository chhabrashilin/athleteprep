"use server";

import { getServerUser } from "@/lib/supabase/server";
import { isValidSportSlug } from "@/lib/sports/preferences";
import { upsertUserSportPreference } from "@/lib/sports/preferences.server";
import type { SportSlug } from "@/lib/sports/registry";

/**
 * Server Action: persist a user's sport selection to Supabase.
 * Safe to call from client components — auth is resolved server-side.
 * Unauthenticated calls return success: false without throwing.
 */
export async function saveSportPreferenceAction(
  sportSlug: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidSportSlug(sportSlug)) {
    return { success: false, error: "Invalid sport selection." };
  }

  const user = await getServerUser();
  if (!user) {
    // Not authenticated — caller should rely on localStorage only.
    return { success: false, error: "Not authenticated." };
  }

  const { error } = await upsertUserSportPreference(user.id, sportSlug as SportSlug);
  if (error) return { success: false, error: error.message };

  return { success: true };
}
