/**
 * lib/cricket/validation/streaming.ts
 * Zod schemas for cricket streaming channels and match streams.
 */

import { z } from "zod";

const UUID = z.string().uuid();

const HTTP_URL = z
  .string()
  .url("Must be a valid URL")
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "URL must use http or https",
  });

const SLUG = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be at most 80 characters")
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens");

const PROVIDERS = ["overlay_only", "youtube", "twitch", "custom_rtmp", "external_embed"] as const;
const VISIBILITIES = ["private", "league", "unlisted", "public"] as const;
const STREAM_STATUSES = [
  "not_configured", "scheduled", "ready", "live", "paused", "ended", "failed", "archived",
] as const;

// ─── streamChannelSchema ──────────────────────────────────────────────────────

export const streamChannelSchema = z.object({
  league_id:         UUID,
  team_id:           UUID.optional().nullable(),
  name:              z.string().min(2, "Name must be at least 2 characters").max(100),
  slug:              SLUG,
  provider:          z.enum(PROVIDERS),
  provider_channel_id: z.string().max(200).optional().nullable(),
  public_watch_url:  HTTP_URL.optional().nullable().or(z.literal("")),
  embed_url:         HTTP_URL.optional().nullable().or(z.literal("")),
  rtmp_ingest_url:   z.string().max(500).optional().nullable(),
  is_active:         z.boolean().optional(),
});

export type StreamChannelInput = z.infer<typeof streamChannelSchema>;

// ─── matchStreamSchema ────────────────────────────────────────────────────────

export const matchStreamSchema = z.object({
  match_id:            UUID,
  league_id:           UUID.optional().nullable(),
  channel_id:          UUID.optional().nullable(),
  title:               z.string().min(2, "Title required").max(200),
  description:         z.string().max(1000).optional().nullable(),
  provider:            z.enum(PROVIDERS),
  public_watch_url:    HTTP_URL.optional().nullable().or(z.literal("")),
  embed_url:           HTTP_URL.optional().nullable().or(z.literal("")),
  scheduled_start:     z.string().datetime({ offset: true }).optional().nullable(),
  visibility:          z.enum(VISIBILITIES),
  allow_public_embed:  z.boolean(),
  overlay_theme_id:    UUID.optional().nullable(),
}).refine((d) => {
  if (d.provider === "external_embed" && !d.embed_url && !d.public_watch_url) {
    return false;
  }
  return true;
}, {
  message: "external_embed provider requires an embed_url or public_watch_url",
  path: ["embed_url"],
});

export type MatchStreamInput = z.infer<typeof matchStreamSchema>;

// ─── updateMatchStreamStatusSchema ───────────────────────────────────────────

export const updateMatchStreamStatusSchema = z.object({
  match_stream_id: UUID,
  status:          z.enum(STREAM_STATUSES),
});

export type UpdateMatchStreamStatusInput = z.infer<typeof updateMatchStreamStatusSchema>;

// ─── streamHealthCheckSchema ──────────────────────────────────────────────────

export const streamHealthCheckSchema = z.object({
  match_stream_id: UUID,
  match_id:        UUID,
  status:          z.enum(["unknown", "healthy", "warning", "critical", "offline"]),
  latency_ms:      z.number().int().min(0).max(60000).optional().nullable(),
  dropped_frames:  z.number().int().min(0).optional().nullable(),
  bitrate_kbps:    z.number().int().min(0).optional().nullable(),
  viewer_count:    z.number().int().min(0).optional().nullable(),
  message:         z.string().max(500).optional().nullable(),
});

export type StreamHealthCheckInput = z.infer<typeof streamHealthCheckSchema>;

// ─── streamEventSchema ────────────────────────────────────────────────────────

export const streamEventSchema = z.object({
  match_stream_id: UUID.optional().nullable(),
  match_id:        UUID,
  league_id:       UUID.optional().nullable(),
  event_type:      z.string().min(1).max(100),
  event_payload:   z.record(z.string(), z.unknown()).optional(),
});

export type StreamEventInput = z.infer<typeof streamEventSchema>;

// ─── checklistUpdateSchema ────────────────────────────────────────────────────

export const checklistUpdateSchema = z.object({
  checklist_key: z.string().min(1).max(100),
  completed:     z.boolean(),
});

export type ChecklistUpdateInput = z.infer<typeof checklistUpdateSchema>;
