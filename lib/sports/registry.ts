/**
 * lib/sports/registry.ts — Central sport registry for the GameIQ multi-sport platform.
 *
 * Each sport entry declares its slug, display name, enabled status, and the
 * feature groups it eventually supports. Enabled status is derived from
 * feature flags so it can be toggled without code changes.
 *
 * Usage:
 *   import { getEnabledSports, isSportEnabled } from "@/lib/sports/registry";
 */

import { isCricketEnabled } from "@/lib/config/feature-flags";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SportSlug =
  | "general"
  | "cricket"
  | "baseball"
  | "basketball"
  | "soccer"
  | "football";

export type SportStatus = "enabled" | "disabled" | "coming_soon";

export interface SportEntry {
  slug: SportSlug;
  displayName: string;
  status: SportStatus;
  tagline: string;
  icon: string;
  supportedFeatureGroups: string[];
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const SPORTS_REGISTRY: SportEntry[] = [
  {
    slug: "general",
    displayName: "General Sports",
    status: "enabled",
    tagline: "Existing GameIQ team, game, timestamp, and report workflows.",
    icon: "⚡",
    supportedFeatureGroups: [
      "teams",
      "players",
      "games",
      "timestamps",
      "reports",
      "sharing",
      "exports",
    ],
  },
  {
    slug: "cricket",
    displayName: "Cricket",
    status: isCricketEnabled() ? "enabled" : "disabled",
    tagline:
      "League management, scoring, analytics, and team intelligence for cricket.",
    icon: "🏏",
    supportedFeatureGroups: [
      "leagues",
      "tournaments",
      "teams",
      "players",
      "matches",
      "schedules",
      "scorecards",
      "points-table",
      "live-scoring",
      "analytics",
      "streaming",
      "community",
      "marketplace",
    ],
  },
  {
    slug: "baseball",
    displayName: "Baseball",
    status: "coming_soon",
    tagline: "Coming soon — pitching analytics, batting stats, and game management.",
    icon: "⚾",
    supportedFeatureGroups: ["teams", "players", "games"],
  },
  {
    slug: "basketball",
    displayName: "Basketball",
    status: "coming_soon",
    tagline: "Coming soon — play-by-play analysis and team performance tracking.",
    icon: "🏀",
    supportedFeatureGroups: ["teams", "players", "games"],
  },
  {
    slug: "soccer",
    displayName: "Soccer",
    status: "coming_soon",
    tagline: "Coming soon — possession analytics, set-piece review, and match reports.",
    icon: "⚽",
    supportedFeatureGroups: ["teams", "players", "games"],
  },
  {
    slug: "football",
    displayName: "Football",
    status: "coming_soon",
    tagline: "Coming soon — film breakdown, formation analysis, and scout reports.",
    icon: "🏈",
    supportedFeatureGroups: ["teams", "players", "games"],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Returns every sport in the registry regardless of status. */
export function getAllSports(): SportEntry[] {
  return SPORTS_REGISTRY;
}

/** Returns only sports with status "enabled". */
export function getEnabledSports(): SportEntry[] {
  return SPORTS_REGISTRY.filter((s) => s.status === "enabled");
}

/** Returns the sport entry for the given slug, or undefined if not found. */
export function getSportBySlug(slug: string): SportEntry | undefined {
  return SPORTS_REGISTRY.find((s) => s.slug === slug);
}

/** Returns true if the sport exists in the registry and is currently enabled. */
export function isSportEnabled(slug: string): boolean {
  const sport = getSportBySlug(slug);
  return sport?.status === "enabled";
}
