/**
 * lib/cricket/validation/moderation.ts
 * Zod schemas for community moderation actions and reports.
 */

import { z } from "zod";

const UUID = z.string().uuid();

// ─── Report schema ────────────────────────────────────────────────────────────

export const REPORT_TARGET_TYPES = [
  "post",
  "comment",
  "thread_message",
  "poll",
  "player_profile",
  "team_profile",
] as const;

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "inappropriate_content",
  "off_topic",
  "other",
] as const;

export const createReportSchema = z.object({
  target_type: z.enum(REPORT_TARGET_TYPES),
  target_id: UUID,
  league_id: UUID.optional().nullable(),
  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters")
    .max(120, "Reason must be 120 characters or fewer"),
  details: z.string().max(1000, "Details must be 1000 characters or fewer").optional().nullable(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ─── Report resolution ────────────────────────────────────────────────────────

export const resolveReportSchema = z.object({
  report_id: UUID,
  resolution_notes: z.string().max(1000).optional().nullable(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

export const dismissReportSchema = z.object({
  report_id: UUID,
  reason: z.string().max(500).optional().nullable(),
});

export type DismissReportInput = z.infer<typeof dismissReportSchema>;

// ─── Moderation action schema ─────────────────────────────────────────────────

export const MODERATION_ACTIONS = [
  "approve",
  "reject",
  "hide",
  "unhide",
  "remove",
  "restore",
  "pin",
  "unpin",
  "lock_thread",
  "unlock_thread",
  "resolve_report",
  "dismiss_report",
] as const;

export const MODERATION_TARGET_TYPES = [
  "post",
  "comment",
  "thread_message",
  "poll",
  "thread",
] as const;

export const moderationActionSchema = z.object({
  league_id: UUID.optional().nullable(),
  target_type: z.enum(MODERATION_TARGET_TYPES),
  target_id: UUID,
  action: z.enum(MODERATION_ACTIONS),
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;

// ─── Thread message schema ────────────────────────────────────────────────────

const MAX_THREAD_MESSAGE_LENGTH = parseInt(
  process.env.CRICKET_MAX_COMMENT_LENGTH ?? "1000",
  10
);

const NO_RAW_HTML = z
  .string()
  .refine((v) => !/<\s*(script|iframe|object|embed|form|input|button)/i.test(v), {
    message: "HTML tags are not allowed",
  });

export const createThreadMessageSchema = z.object({
  thread_id: UUID,
  match_id: UUID.optional().nullable(),
  body: NO_RAW_HTML.min(1, "Message is required").max(
    MAX_THREAD_MESSAGE_LENGTH,
    `Message must be ${MAX_THREAD_MESSAGE_LENGTH} characters or fewer`
  ),
  message_type: z
    .enum(["message", "scorer_update", "system", "admin_notice"])
    .default("message"),
});

export type CreateThreadMessageInput = z.infer<typeof createThreadMessageSchema>;

export const updateThreadMessageSchema = z.object({
  body: NO_RAW_HTML.min(1).max(MAX_THREAD_MESSAGE_LENGTH),
});

export type UpdateThreadMessageInput = z.infer<typeof updateThreadMessageSchema>;
