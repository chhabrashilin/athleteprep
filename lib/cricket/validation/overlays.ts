/**
 * lib/cricket/validation/overlays.ts
 * Zod schemas for overlay themes and tokens.
 */

import { z } from "zod";

const UUID = z.string().uuid();

const HEX_COLOR = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color");

const HTTP_URL = z
  .string()
  .url("Must be a valid URL")
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "URL must use http or https",
  });

const SLUG = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens");

const LAYOUTS = [
  "classic_scorebug", "lower_third", "full_scorecard", "innings_summary",
  "toss_card", "result_card", "minimal", "vertical_mobile",
] as const;

const SCOPES = ["match_overlay", "scorebug", "full_overlay", "read_only_stream"] as const;

// ─── overlayThemeSchema ───────────────────────────────────────────────────────

export const overlayThemeSchema = z.object({
  league_id:        UUID,
  team_id:          UUID.optional().nullable(),
  name:             z.string().min(2).max(100),
  slug:             SLUG,
  layout:           z.enum(LAYOUTS),
  primary_color:    HEX_COLOR.optional().nullable().or(z.literal("")),
  secondary_color:  HEX_COLOR.optional().nullable().or(z.literal("")),
  accent_color:     HEX_COLOR.optional().nullable().or(z.literal("")),
  text_color:       HEX_COLOR.optional().nullable().or(z.literal("")),
  background_color: HEX_COLOR.optional().nullable().or(z.literal("")),
  logo_url:         HTTP_URL.optional().nullable().or(z.literal("")),
  sponsor_logo_url: HTTP_URL.optional().nullable().or(z.literal("")),
  sponsor_text:     z.string().max(80).optional().nullable(),
  font_family:      z.string().max(100).optional().nullable(),
  safe_area_top:    z.number().int().min(0).max(200).optional(),
  safe_area_bottom: z.number().int().min(0).max(200).optional(),
  safe_area_left:   z.number().int().min(0).max(200).optional(),
  safe_area_right:  z.number().int().min(0).max(200).optional(),
  is_default:       z.boolean().optional(),
});

export type OverlayThemeInput = z.infer<typeof overlayThemeSchema>;

// ─── overlayTokenCreateSchema ─────────────────────────────────────────────────

export const overlayTokenCreateSchema = z.object({
  match_id:   UUID,
  league_id:  UUID.optional().nullable(),
  label:      z.string().max(100).optional().nullable(),
  scope:      z.enum(SCOPES),
  expires_at: z.string().datetime({ offset: true }).optional().nullable().refine(
    (v) => !v || new Date(v) > new Date(),
    { message: "Expiry must be in the future" }
  ),
});

export type OverlayTokenCreateInput = z.infer<typeof overlayTokenCreateSchema>;

// ─── overlayTokenRevokeSchema ─────────────────────────────────────────────────

export const overlayTokenRevokeSchema = z.object({
  token_id: UUID,
});

export type OverlayTokenRevokeInput = z.infer<typeof overlayTokenRevokeSchema>;
