/**
 * lib/cricket/validation/team.ts
 * Zod schemas and helpers for cricket team creation and updates.
 */

import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TEAM_TYPES = [
  "club",
  "school",
  "university",
  "corporate",
  "academy",
  "franchise",
  "casual",
  "other",
] as const;

export const TEAM_REGISTRATION_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "archived",
] as const;

export const TEAM_MEMBER_ROLES = [
  "owner",
  "manager",
  "coach",
  "captain",
  "vice_captain",
  "scorer",
  "analyst",
  "player",
  "member",
] as const;

export const TEAM_INVITE_ROLES = [
  "manager",
  "coach",
  "captain",
  "vice_captain",
  "scorer",
  "analyst",
  "player",
  "member",
] as const;

const CURRENT_YEAR = new Date().getFullYear();

// ─── Slug helpers ─────────────────────────────────────────────────────────────

/** Derive a URL-safe slug from a team name. */
export function generateTeamSlug(name: string, leagueName?: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!leagueName) return base;

  const suffix = leagueName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  return suffix ? `${base}-${suffix}` : base;
}

/** Normalize a manually-typed slug value. */
export function normalizeTeamSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalize an email address. */
export function normalizeCricketEmail(value: string): string {
  return value.toLowerCase().trim();
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Validates a jersey number: 1–4 chars, alphanumeric. */
export function validateJerseyNumber(value: string): boolean {
  return /^[A-Za-z0-9]{1,4}$/.test(value);
}

// ─── Hex color helper ─────────────────────────────────────────────────────────

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code (e.g. #1a2b3c).")
  .optional()
  .or(z.literal(""));

// ─── Team creation schema ─────────────────────────────────────────────────────

const teamBaseObject = z.object({
  leagueId: z.string().uuid("League ID must be a valid UUID."),

  name: z
    .string()
    .min(2, "Team name must be at least 2 characters.")
    .max(100, "Team name must be 100 characters or fewer."),

  shortName: z
    .string()
    .min(1, "Short name must be at least 1 character.")
    .max(20, "Short name must be 20 characters or fewer."),

  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(80, "Slug must be 80 characters or fewer.")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      "Slug may only contain lowercase letters, numbers, and hyphens."
    )
    .optional(),

  description: z
    .string()
    .max(1000, "Description must be 1000 characters or fewer.")
    .optional(),

  teamType: z.enum(TEAM_TYPES, { error: "Please select a valid team type." }).optional(),

  logoUrl: z.string().url("Please enter a valid logo URL.").optional().or(z.literal("")),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,

  homeGround: z.string().max(120, "Home ground name must be 120 characters or fewer.").optional(),

  managerName: z.string().max(100).optional(),
  managerEmail: z
    .string()
    .email("Please enter a valid manager email address.")
    .optional()
    .or(z.literal("")),

  contactEmail: z
    .string()
    .email("Please enter a valid contact email address.")
    .optional()
    .or(z.literal("")),

  contactPhone: z.string().max(30).optional(),

  websiteUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com).")
    .optional()
    .or(z.literal("")),

  instagramUrl: z
    .string()
    .url("Please enter a valid Instagram URL.")
    .optional()
    .or(z.literal("")),

  foundedYear: z
    .number()
    .int("Founded year must be a whole number.")
    .min(1800, "Founded year must be 1800 or later.")
    .max(CURRENT_YEAR, `Founded year cannot be in the future.`)
    .optional(),

  coachName: z.string().max(100).optional(),
  scorerName: z.string().max(100).optional(),
});

export const createTeamSchema = teamBaseObject;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = teamBaseObject.partial().omit({ leagueId: true }).extend({
  isActive: z.boolean().optional(),
});
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// ─── Invite team member schema ────────────────────────────────────────────────

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(TEAM_INVITE_ROLES, { error: "Please select a valid role." }),
});
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
