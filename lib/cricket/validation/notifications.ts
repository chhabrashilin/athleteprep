/**
 * lib/cricket/validation/notifications.ts
 * Zod schemas for in-app cricket notifications.
 */

import { z } from "zod";

const UUID = z.string().uuid();

export const NOTIFICATION_TYPES = [
  "announcement.created",
  "post.comment",
  "comment.reply",
  "poll.created",
  "poll.closed",
  "match.thread_message",
  "match.live_started",
  "match.result_posted",
  "broadcast.live",
  "report.resolved",
  "role.invited",
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

export const createNotificationSchema = z.object({
  recipient_user_id: UUID,
  actor_user_id: UUID.optional().nullable(),
  league_id: UUID.optional().nullable(),
  team_id: UUID.optional().nullable(),
  match_id: UUID.optional().nullable(),
  notification_type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(200),
  body: z.string().max(500).optional().nullable(),
  action_url: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || v.startsWith("/") || v.startsWith("http"), {
      message: "action_url must be a relative path or absolute URL",
    }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const markReadSchema = z.object({
  notification_id: UUID,
});

export interface CricketNotification {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  leagueId: string | null;
  teamId: string | null;
  matchId: string | null;
  notificationType: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
