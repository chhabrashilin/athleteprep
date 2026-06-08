/**
 * lib/cricket/validation/sponsorship.ts
 * Zod schemas for sponsorship packages and inquiries.
 */

import { z } from "zod";

export const PACKAGE_TYPES = [
  "league",
  "team",
  "match",
  "broadcast",
  "overlay",
  "jersey",
  "ground",
  "digital",
  "custom",
] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const sponsorshipPackageBaseSchema = z.object({
  league_id: z.string().uuid("Invalid league ID"),
  team_id: z.string().uuid().optional().nullable(),
  match_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Package name too short").max(120, "Package name too long"),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(3000).optional().nullable(),
  package_type: z.enum(PACKAGE_TYPES),
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  price_cents: z.number().int().min(0).optional().nullable(),
  inventory_quantity: z.number().int().min(0).optional().nullable(),
  benefits: z.array(z.string().max(500)).max(50).default([]),
  placement_options: z.record(z.string(), z.unknown()).optional().default({}),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  visibility: z
    .enum(["private", "league", "unlisted", "public"])
    .default("private"),
});

export const createSponsorshipPackageSchema = sponsorshipPackageBaseSchema.superRefine(
  (data, ctx) => {
    if (data.start_date && data.end_date) {
      if (new Date(data.end_date) < new Date(data.start_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be on or after start date",
          path: ["end_date"],
        });
      }
    }
  }
);
export type CreateSponsorshipPackageInput = z.infer<typeof createSponsorshipPackageSchema>;

export const updateSponsorshipPackageSchema = sponsorshipPackageBaseSchema.partial();
export type UpdateSponsorshipPackageInput = z.infer<typeof updateSponsorshipPackageSchema>;

export const createSponsorshipInquirySchema = z.object({
  package_id: z.string().uuid().optional().nullable(),
  league_id: z.string().uuid("Invalid league ID"),
  team_id: z.string().uuid().optional().nullable(),
  match_id: z.string().uuid().optional().nullable(),
  company_name: z.string().min(1, "Company name is required").max(200),
  contact_name: z.string().min(1, "Contact name is required").max(200),
  contact_email: z.string().email("Valid email required"),
  contact_phone: z.string().max(30).optional().nullable(),
  message: z
    .string()
    .max(2000, "Message cannot exceed 2000 characters")
    .optional()
    .nullable(),
});
export type CreateSponsorshipInquiryInput = z.infer<typeof createSponsorshipInquirySchema>;
