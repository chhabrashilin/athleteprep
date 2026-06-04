import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MATCH_STAGES = [
  "league",
  "group",
  "quarter_final",
  "semi_final",
  "final",
  "friendly",
  "practice",
  "playoff",
  "custom",
] as const;

export const MATCH_PUBLISH_STATUSES = ["draft", "published", "hidden", "archived"] as const;

export const MATCH_SCHEDULE_STATUSES = [
  "unscheduled",
  "scheduled",
  "rescheduled",
  "postponed",
  "cancelled",
  "completed",
] as const;

export const MATCH_OFFICIAL_ROLES = [
  "scorer",
  "umpire",
  "square_leg_umpire",
  "match_referee",
  "ground_manager",
  "stream_operator",
  "admin",
  "other",
] as const;

export const MATCH_OFFICIAL_STATUSES = [
  "assigned",
  "accepted",
  "declined",
  "replaced",
  "removed",
] as const;

// ─── Slug helpers ─────────────────────────────────────────────────────────────

export function generateMatchSlug(
  homeTeam: string,
  awayTeam: string,
  date?: string
): string {
  const parts = [homeTeam, "vs", awayTeam, date].filter(Boolean).join("-");
  return parts
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function normalizeMatchSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function validateMatchTimeRange(start: string, end: string): boolean {
  return new Date(end) > new Date(start);
}

export function validateTeamsAreDifferent(homeTeamId: string, awayTeamId: string): boolean {
  return homeTeamId !== awayTeamId;
}

export function estimateMatchEndTime(start: string, durationMinutes: number): string {
  const startDate = new Date(start);
  startDate.setMinutes(startDate.getMinutes() + durationMinutes);
  return startDate.toISOString();
}

// ─── Schema ───────────────────────────────────────────────────────────────────

export const createMatchSchema = z
  .object({
    leagueId: z.string().uuid("Invalid league ID"),
    homeTeamId: z.string().uuid("Invalid home team ID"),
    awayTeamId: z.string().uuid("Invalid away team ID"),
    oversPerInnings: z
      .number()
      .int()
      .min(1, "Must be at least 1 over")
      .max(100, "Cannot exceed 100 overs"),

    // Optional scheduling fields
    venueId: z.string().uuid().optional().nullable(),
    scheduledStart: z.string().datetime({ offset: true }).optional().nullable(),
    scheduledEnd: z.string().datetime({ offset: true }).optional().nullable(),
    timezone: z.string().default("America/New_York"),
    matchNumber: z.number().int().positive("Match number must be positive").optional().nullable(),
    roundName: z.string().max(80).optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    stage: z.enum(MATCH_STAGES).optional().nullable(),
    title: z.string().max(140, "Title too long").optional().nullable(),
    matchType: z.string().optional(),
    neutralMatch: z.boolean().default(false),
    scorerUserId: z.string().uuid().optional().nullable(),
    primaryUmpireName: z.string().max(120).optional().nullable(),
    secondaryUmpireName: z.string().max(120).optional().nullable(),
    matchRefereeName: z.string().max(120).optional().nullable(),
    notes: z.string().max(2000, "Notes too long").optional().nullable(),
    internalNotes: z.string().max(2000, "Internal notes too long").optional().nullable(),
    publishStatus: z.enum(MATCH_PUBLISH_STATUSES).default("draft"),
    scheduleStatus: z.enum(MATCH_SCHEDULE_STATUSES).default("unscheduled"),
  })
  .superRefine((data, ctx) => {
    if (data.homeTeamId === data.awayTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Home team and away team must be different",
        path: ["awayTeamId"],
      });
    }
    if (data.scheduledStart && data.scheduledEnd) {
      if (!validateMatchTimeRange(data.scheduledStart, data.scheduledEnd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled end must be after scheduled start",
          path: ["scheduledEnd"],
        });
      }
    }
  });

export const updateMatchSchema = z
  .object({
    homeTeamId: z.string().uuid().optional(),
    awayTeamId: z.string().uuid().optional(),
    venueId: z.string().uuid().optional().nullable(),
    scheduledStart: z.string().datetime({ offset: true }).optional().nullable(),
    scheduledEnd: z.string().datetime({ offset: true }).optional().nullable(),
    timezone: z.string().optional(),
    matchNumber: z.number().int().positive().optional().nullable(),
    roundName: z.string().max(80).optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    stage: z.enum(MATCH_STAGES).optional().nullable(),
    title: z.string().max(140).optional().nullable(),
    matchType: z.string().optional(),
    oversPerInnings: z.number().int().min(1).max(100).optional(),
    neutralMatch: z.boolean().optional(),
    scorerUserId: z.string().uuid().optional().nullable(),
    primaryUmpireName: z.string().max(120).optional().nullable(),
    secondaryUmpireName: z.string().max(120).optional().nullable(),
    matchRefereeName: z.string().max(120).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    internalNotes: z.string().max(2000).optional().nullable(),
    publishStatus: z.enum(MATCH_PUBLISH_STATUSES).optional(),
    scheduleStatus: z.enum(MATCH_SCHEDULE_STATUSES).optional(),
    cancellationReason: z.string().max(500).optional().nullable(),
    weatherNotes: z.string().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.homeTeamId && data.awayTeamId && data.homeTeamId === data.awayTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Home team and away team must be different",
        path: ["awayTeamId"],
      });
    }
    if (data.scheduledStart && data.scheduledEnd) {
      if (!validateMatchTimeRange(data.scheduledStart, data.scheduledEnd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled end must be after scheduled start",
          path: ["scheduledEnd"],
        });
      }
    }
  });

export const scheduleMatchSchema = z
  .object({
    venueId: z.string().uuid().optional().nullable(),
    scheduledStart: z.string().datetime({ offset: true }),
    scheduledEnd: z.string().datetime({ offset: true }).optional().nullable(),
    timezone: z.string().default("America/New_York"),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledEnd) {
      if (!validateMatchTimeRange(data.scheduledStart, data.scheduledEnd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled end must be after scheduled start",
          path: ["scheduledEnd"],
        });
      }
    }
  });

export const assignOfficialSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  role: z.enum(MATCH_OFFICIAL_ROLES),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type ScheduleMatchInput = z.infer<typeof scheduleMatchSchema>;
export type AssignOfficialInput = z.infer<typeof assignOfficialSchema>;
