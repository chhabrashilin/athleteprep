/**
 * lib/cricket/validation/team-kit.ts
 * Zod schemas for cricket team kit requests.
 */

import { z } from "zod";

export const KIT_TYPES = [
  "jerseys_only",
  "pants_only",
  "full_team_kit",
  "training_kit",
  "fan_merch",
  "custom",
] as const;

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #1A2B3C)")
  .optional()
  .nullable()
  .or(z.literal(""));

const futureDateSchema = z
  .string()
  .optional()
  .nullable()
  .refine((val) => {
    if (!val) return true;
    return new Date(val) >= new Date(new Date().toDateString());
  }, "Delivery deadline cannot be in the past");

export const createTeamKitRequestSchema = z.object({
  team_id: z.string().uuid("Invalid team ID"),
  league_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  kit_type: z.enum(KIT_TYPES),
  quantity_players: z
    .number()
    .int()
    .min(1, "Player quantity must be at least 1")
    .max(500)
    .optional()
    .nullable(),
  quantity_staff: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
  primary_color: hexColorSchema,
  secondary_color: hexColorSchema,
  accent_color: hexColorSchema,
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
  sponsor_logo_url: z.string().url().optional().nullable().or(z.literal("")),
  design_notes: z.string().max(3000, "Design notes too long").optional().nullable(),
  size_breakdown: z.record(z.string(), z.unknown()).optional().default({}),
  delivery_deadline: futureDateSchema,
  budget_cents: z
    .number()
    .int()
    .min(0, "Budget cannot be negative")
    .optional()
    .nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
});
export type CreateTeamKitRequestInput = z.infer<typeof createTeamKitRequestSchema>;

export const updateTeamKitRequestSchema = createTeamKitRequestSchema.partial();
export type UpdateTeamKitRequestInput = z.infer<typeof updateTeamKitRequestSchema>;

export const quoteTeamKitRequestSchema = z.object({
  quote_amount_cents: z
    .number()
    .int()
    .min(0, "Quote amount cannot be negative"),
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  notes: z.string().max(2000).optional().nullable(),
});
export type QuoteTeamKitRequestInput = z.infer<typeof quoteTeamKitRequestSchema>;
