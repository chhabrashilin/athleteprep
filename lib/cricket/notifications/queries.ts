/**
 * lib/cricket/notifications/queries.ts
 * Data access for in-app cricket notifications.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CricketNotification } from "@/lib/cricket/validation/notifications";

function rowToNotification(row: Record<string, unknown>): CricketNotification {
  return {
    id: row.id as string,
    recipientUserId: row.recipient_user_id as string,
    actorUserId: (row.actor_user_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    notificationType: row.notification_type as string,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    actionUrl: (row.action_url as string | null) ?? null,
    readAt: (row.read_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

export interface NotificationFilters {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function getUserCricketNotifications(
  userId: string,
  filters: NotificationFilters = {}
): Promise<CricketNotification[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_notifications")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false });

  if (filters.unreadOnly) {
    query = query.is("read_at", null);
  }

  const limit = filters.limit ?? 30;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data } = await query;
  return (data ?? []).map(rowToNotification);
}

export async function getUnreadCricketNotificationCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 0;

  const { count } = await supabase
    .from("cricket_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

export async function getRecentCricketNotifications(
  userId: string,
  limit = 10
): Promise<CricketNotification[]> {
  return getUserCricketNotifications(userId, { limit });
}
