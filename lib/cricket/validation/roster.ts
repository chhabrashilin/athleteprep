/**
 * lib/cricket/validation/roster.ts
 * Zod schemas for cricket roster management.
 */

import { z } from "zod";
import { validateJerseyNumber } from "./team";

export const rosterEntrySchema = z.object({
  cricketTeamId: z.string().uuid("Team ID must be a valid UUID."),
  cricketPlayerId: z.string().uuid("Player ID must be a valid UUID."),

  jerseyNumber: z
    .string()
    .refine((v) => !v || validateJerseyNumber(v), {
      message: "Jersey number must be 1–4 alphanumeric characters.",
    })
    .optional(),

  rosterRole: z.string().max(80).optional(),
  isCaptain: z.boolean().optional(),
  isViceCaptain: z.boolean().optional(),
});

export type RosterEntryInput = z.infer<typeof rosterEntrySchema>;

export const updateRosterEntrySchema = rosterEntrySchema.partial().omit({
  cricketTeamId: true,
  cricketPlayerId: true,
});
export type UpdateRosterEntryInput = z.infer<typeof updateRosterEntrySchema>;
