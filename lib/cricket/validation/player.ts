/**
 * lib/cricket/validation/player.ts
 * Zod schemas and helpers for cricket player creation and updates.
 */

import { z } from "zod";
import { validateJerseyNumber } from "./team";

export { validateJerseyNumber };

// ─── Constants ────────────────────────────────────────────────────────────────

export const BATTING_STYLES = [
  "right_hand_bat",
  "left_hand_bat",
  "unknown",
] as const;

export const BOWLING_STYLES = [
  "right_arm_fast",
  "right_arm_medium",
  "right_arm_spin",
  "left_arm_fast",
  "left_arm_medium",
  "left_arm_spin",
  "wicketkeeper",
  "none",
  "unknown",
] as const;

export const PRIMARY_ROLES = [
  "batter",
  "bowler",
  "all_rounder",
  "wicketkeeper",
  "captain",
  "coach",
  "unknown",
] as const;

export const AVAILABILITY_STATUSES = [
  "active",
  "injured",
  "unavailable",
  "retired",
  "archived",
] as const;

// ─── Player slug helper ───────────────────────────────────────────────────────

/** Derive a URL-safe slug from a player display name. */
export function generatePlayerSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalize a manually-typed player slug. */
export function normalizePlayerSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Player creation schema ───────────────────────────────────────────────────

const playerBaseObject = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters.")
    .max(100, "Display name must be 100 characters or fewer."),

  email: z
    .string()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),

  phone: z.string().max(30).optional(),

  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),

  primaryRole: z.string().optional(),
  secondaryRole: z.string().optional(),

  profilePhotoUrl: z
    .string()
    .url("Please enter a valid photo URL.")
    .optional()
    .or(z.literal("")),

  bio: z
    .string()
    .max(1000, "Bio must be 1000 characters or fewer.")
    .optional(),

  dateOfBirth: z.string().optional(),

  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),

  jerseyNumber: z
    .string()
    .refine((v) => !v || validateJerseyNumber(v), {
      message: "Jersey number must be 1–4 alphanumeric characters.",
    })
    .optional(),

  dominantHand: z.string().optional(),

  fieldingPositionPreference: z.string().max(80).optional(),

  battingOrderPreference: z
    .number()
    .int("Batting order must be a whole number.")
    .min(1, "Batting order minimum is 1.")
    .max(11, "Batting order maximum is 11.")
    .optional(),
});

export const createPlayerSchema = playerBaseObject;
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = playerBaseObject.partial();
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
