"use server";

/**
 * lib/cricket/notifications/actions.ts
 * Server actions for in-app notifications.
 * In-app notifications always persist to Supabase.
 * Email/push is provider-gated via env flags.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createNotificationSchema,
  type CreateNotificationInput,
} from "@/lib/cricket/validation/notifications";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createCricketNotification(
  input: CreateNotificationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid notification" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data, error } = await supabase
    .from("cricket_notifications")
    .insert({
      recipient_user_id: d.recipient_user_id,
      actor_user_id: d.actor_user_id ?? null,
      league_id: d.league_id ?? null,
      team_id: d.team_id ?? null,
      match_id: d.match_id ?? null,
      notification_type: d.notification_type,
      title: d.title,
      body: d.body ?? null,
      action_url: d.action_url ?? null,
      metadata: d.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create notification" };
  return { success: true, data: { id: data.id as string } };
}

export async function createBulkCricketNotifications(
  inputs: CreateNotificationInput[]
): Promise<ActionResult<{ count: number }>> {
  if (!inputs.length) return { success: true, data: { count: 0 } };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const rows = inputs.map((d) => ({
    recipient_user_id: d.recipient_user_id,
    actor_user_id: d.actor_user_id ?? null,
    league_id: d.league_id ?? null,
    team_id: d.team_id ?? null,
    match_id: d.match_id ?? null,
    notification_type: d.notification_type,
    title: d.title,
    body: d.body ?? null,
    action_url: d.action_url ?? null,
    metadata: d.metadata ?? {},
  }));

  const { error, count } = await supabase
    .from("cricket_notifications")
    .insert(rows)
    .select("id", { count: "exact", head: true });

  if (error) return { success: false, error: "Failed to create notifications" };
  return { success: true, data: { count: count ?? inputs.length } };
}

export async function markCricketNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) return { success: false, error: "Failed to mark notification as read" };
  return { success: true };
}

export async function markAllCricketNotificationsRead(): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  if (error) return { success: false, error: "Failed to mark notifications as read" };
  return { success: true };
}

export async function deleteCricketNotification(notificationId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_notifications")
    .delete()
    .eq("id", notificationId)
    .eq("recipient_user_id", user.id);

  if (error) return { success: false, error: "Failed to delete notification" };
  return { success: true };
}
