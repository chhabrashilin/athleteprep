/**
 * lib/cricket/validation/league.ts
 * Zod schemas and helpers for cricket league creation and updates.
 */

import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const LEAGUE_FORMATS = [
  "round_robin",
  "knockout",
  "group_stage",
  "franchise",
  "friendly",
  "custom",
] as const;

export const LEAGUE_VISIBILITIES = ["private", "unlisted", "public"] as const;

export const LEAGUE_REGISTRATION_STATUSES = [
  "draft",
  "open",
  "closed",
  "archived",
] as const;

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const BALL_TYPES = ["leather", "tennis", "rubber", "pink", "other"] as const;

// ─── Slug helpers ─────────────────────────────────────────────────────────────

/** Derive a URL-safe slug from a league name. */
export function generateLeagueSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalise a manually-typed slug value (lowercase, collapse hyphens). */
export function normalizeLeagueSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Date range helper ────────────────────────────────────────────────────────

export function validateLeagueDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) return { valid: true };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format." };
  }
  if (end < start) {
    return { valid: false, error: "End date must be on or after start date." };
  }
  return { valid: true };
}

// ─── Base object (shared between create and update) ───────────────────────────

const leagueBaseObject = z.object({
  name: z
    .string()
    .min(3, "League name must be at least 3 characters.")
    .max(100, "League name must be 100 characters or fewer."),

  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(80, "Slug must be 80 characters or fewer.")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Slug may only contain lowercase letters, numbers, and hyphens, and must not start or end with a hyphen."
    ),

  seasonName: z
    .string()
    .min(2, "Season name must be at least 2 characters.")
    .max(80, "Season name must be 80 characters or fewer."),

  format: z.enum(LEAGUE_FORMATS, {
    error: "Please select a valid format.",
  }),

  oversPerInnings: z
    .number({ error: "Overs per innings must be a number." })
    .int("Overs must be a whole number.")
    .min(1, "Minimum 1 over per innings.")
    .max(100, "Maximum 100 overs per innings."),

  timezone: z.string().min(1, "Timezone is required."),

  visibility: z.enum(LEAGUE_VISIBILITIES, {
    error: "Please select a valid visibility option.",
  }),

  description: z.string().max(1000, "Description must be 1000 characters or fewer.").optional(),

  country: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
  city: z.string().max(80).optional(),

  startDate: z.string().optional(),
  endDate: z.string().optional(),

  maxTeams: z
    .number()
    .int("Max teams must be a whole number.")
    .min(2, "Minimum 2 teams.")
    .max(128, "Maximum 128 teams.")
    .optional(),

  contactEmail: z
    .string()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),

  websiteUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com).")
    .optional()
    .or(z.literal("")),

  rulesSummary: z
    .string()
    .max(2000, "Rules summary must be 2000 characters or fewer.")
    .optional(),

  ballType: z.string().optional(),
  matchDays: z.array(z.string()).optional(),

  allowPublicScorecards: z.boolean().optional(),
  allowTeamRegistration: z.boolean().optional(),
  allowPlayerRegistration: z.boolean().optional(),
  requireAdminApproval: z.boolean().optional(),

  // League settings
  defaultOvers: z.number().int().min(1, "Minimum 1 over.").max(100, "Maximum 100 overs.").optional(),
  maxPlayersPerTeam: z.number().int().min(1).max(100).optional(),
  minPlayersPerTeam: z.number().int().min(1).max(100).optional(),

  allowSubstitutes: z.boolean().optional(),
  allowSuperOver: z.boolean().optional(),
  allowDuckworthLewis: z.boolean().optional(),

  pointsWin: z.number().int().min(0).max(100).optional(),
  pointsLoss: z.number().int().min(0).max(100).optional(),
  pointsTie: z.number().int().min(0).max(100).optional(),
  pointsNoResult: z.number().int().min(0).max(100).optional(),

  netRunRateEnabled: z.boolean().optional(),
  bonusPointsEnabled: z.boolean().optional(),
});

// ─── Create league schema — adds date-range cross-field validation ─────────────

export const createLeagueSchema = leagueBaseObject.superRefine((data, ctx) => {
  const range = validateLeagueDateRange(data.startDate, data.endDate);
  if (!range.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: range.error ?? "Invalid date range.",
      path: ["endDate"],
    });
  }
});

export type CreateLeagueInput = z.infer<typeof createLeagueSchema>;

// ─── Update league schema — all fields optional, same date-range check ─────────

export const updateLeagueSchema = leagueBaseObject.partial().superRefine((data, ctx) => {
  const range = validateLeagueDateRange(data.startDate, data.endDate);
  if (!range.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: range.error ?? "Invalid date range.",
      path: ["endDate"],
    });
  }
});

export type UpdateLeagueInput = z.infer<typeof updateLeagueSchema>;

// ─── League settings schema (for updating settings independently) ─────────────

export const updateLeagueSettingsSchema = z.object({
  defaultOvers: z.number().int().min(1).max(100).optional(),
  maxPlayersPerTeam: z.number().int().min(1).max(100).optional(),
  minPlayersPerTeam: z.number().int().min(1).max(100).optional(),
  allowSubstitutes: z.boolean().optional(),
  allowSuperOver: z.boolean().optional(),
  allowDuckworthLewis: z.boolean().optional(),
  pointsWin: z.number().int().min(0).max(100).optional(),
  pointsLoss: z.number().int().min(0).max(100).optional(),
  pointsTie: z.number().int().min(0).max(100).optional(),
  pointsNoResult: z.number().int().min(0).max(100).optional(),
  netRunRateEnabled: z.boolean().optional(),
  bonusPointsEnabled: z.boolean().optional(),
});

export type UpdateLeagueSettingsInput = z.infer<typeof updateLeagueSettingsSchema>;

// ─── Invite schema ────────────────────────────────────────────────────────────

export const INVITE_ROLES = [
  "admin",
  "manager",
  "scorer",
  "player",
  "fan",
  "member",
] as const;

export const inviteLeagueMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(INVITE_ROLES, {
    error: "Please select a valid role.",
  }),
});

export type InviteLeagueMemberInput = z.infer<typeof inviteLeagueMemberSchema>;
