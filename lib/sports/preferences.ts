/**
 * lib/sports/preferences.ts — Client-safe sport preference helpers.
 *
 * These are safe to import in both Server Components and "use client" files
 * because they do NOT import from next/headers or lib/supabase/server.
 *
 * Server-only DB helpers (getUserSportPreference, upsertUserSportPreference)
 * live in lib/sports/preferences.server.ts.
 */

import { getAllSports, type SportSlug } from "@/lib/sports/registry";

// ─── localStorage key ─────────────────────────────────────────────────────────

export const SELECTED_SPORT_KEY = "gameiq:selectedSport";

// ─── Validation ───────────────────────────────────────────────────────────────

/** Returns true when slug is a known sport in the registry. */
export function isValidSportSlug(slug: string | null | undefined): slug is SportSlug {
  if (!slug) return false;
  return getAllSports().some((s) => s.slug === slug);
}

// ─── Client-only helpers ──────────────────────────────────────────────────────
// Guard against SSR: check typeof window before accessing localStorage.

/** Reads the selected sport from localStorage. Returns null on SSR or if unset. */
export function getLocalSelectedSport(): SportSlug | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(SELECTED_SPORT_KEY);
  return isValidSportSlug(stored) ? stored : null;
}

/** Writes the selected sport to localStorage. No-ops on SSR. */
export function setLocalSelectedSport(sportSlug: SportSlug): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_SPORT_KEY, sportSlug);
}

// ─── Pure resolver ────────────────────────────────────────────────────────────

interface ResolveOptions {
  /** Sport slug read from Supabase (remote, authenticated). */
  remoteSport?: string | null;
  /** Sport slug read from localStorage (local, anonymous-safe). */
  localSport?: string | null;
  /** Last-resort fallback. Defaults to "general". */
  fallback?: SportSlug;
}

/**
 * Determines the preferred sport with priority:
 *   1. valid remoteSport (Supabase, authenticated)
 *   2. valid localSport  (localStorage, anonymous)
 *   3. valid fallback
 *   4. "general" (hard default)
 */
export function resolvePreferredSport({
  remoteSport,
  localSport,
  fallback = "general",
}: ResolveOptions): SportSlug {
  if (isValidSportSlug(remoteSport)) return remoteSport;
  if (isValidSportSlug(localSport)) return localSport;
  if (isValidSportSlug(fallback)) return fallback;
  return "general";
}
