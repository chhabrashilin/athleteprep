import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SCHEDULE_FORMATS = ["single_round_robin", "double_round_robin"] as const;

export const PREFERRED_DAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

export const generateScheduleSchema = z
  .object({
    leagueId: z.string().uuid("Invalid league ID"),
    teamIds: z
      .array(z.string().uuid())
      .min(2, "At least 2 teams are required to generate a schedule"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    preferredDays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "At least one preferred day is required"),
    matchStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Match start time must be HH:MM"),
    matchDurationMinutes: z
      .number()
      .int()
      .min(30, "Duration must be at least 30 minutes")
      .max(720, "Duration cannot exceed 720 minutes (12 hours)"),
    venueIds: z.array(z.string().uuid()).default([]),
    maxMatchesPerDay: z.number().int().positive().optional(),
    timezone: z.string().default("America/New_York"),
    format: z.enum(SCHEDULE_FORMATS).default("single_round_robin"),
  })
  .superRefine((data, ctx) => {
    if (data.venueIds.length === 0) {
      // Venue assignment is optional — scheduling without venues is allowed
    }
    // Validate startDate is a real date
    const d = new Date(data.startDate);
    if (isNaN(d.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is not a valid date",
        path: ["startDate"],
      });
    }
  });

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
