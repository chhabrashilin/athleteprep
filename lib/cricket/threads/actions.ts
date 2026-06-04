"use server";

/**
 * lib/cricket/threads/actions.ts
 * Server actions for match threads and thread messages.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createThreadMessageSchema,
  updateThreadMessageSchema,
} from "@/lib/cricket/validation/moderation";
import {
  detectPotentiallyUnsafeContent,
  normalizePostBody,
} from "@/lib/cricket/community/safety";
import { createCricketNotification } from "@/lib/cricket/notifications/actions";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function createOrGetMatchThread(
  matchId: string
): Promise<ActionResult<{ id: string; title: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Try to find existing thread.
  const { data: existing } = await supabase
    .from("cricket_match_threads")
    .select("id, title")
    .eq("match_id", matchId)
    .not("status", "eq", "archived")
    .maybeSingle();

  if (existing) {
    return { success: true, data: { id: existing.id as string, title: existing.title as string } };
  }

  // Fetch match to determine league and title.
  const { data: match } = await supabase
    .from("cricket_matches")
    .select("id, league_id, title, match_date")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return { success: false, error: "Match not found" };

  const leagueId = match.league_id as string | null;
  const title = (match.title as string | null) ?? `Match Thread`;

  // Check permission — any league member can create the first thread.
  if (leagueId) {
    const { data: isMember } = await supabase.rpc("user_is_cricket_league_member", {
      p_league_id: leagueId,
      p_user_id: user.id,
    });
    if (!isMember) return { success: false, error: "Not authorized" };
  }

  const { data: thread, error } = await supabase
    .from("cricket_match_threads")
    .insert({
      match_id: matchId,
      league_id: leagueId,
      title,
      visibility: "league",
      status: "open",
      created_by: user.id,
    })
    .select("id, title")
    .single();

  if (error) return { success: false, error: "Failed to create match thread" };
  return { success: true, data: { id: thread.id as string, title: thread.title as string } };
}

export async function postMatchThreadMessage(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createThreadMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: thread } = await supabase
    .from("cricket_match_threads")
    .select("id, status, league_id, slow_mode_seconds")
    .eq("id", parsed.data.thread_id)
    .maybeSingle();

  if (!thread) return { success: false, error: "Thread not found" };
  if ((thread.status as string) !== "open") return { success: false, error: "Thread is not open" };

  const safetyResult = detectPotentiallyUnsafeContent(parsed.data.body);
  if (safetyResult.status === "blocked") {
    return { success: false, error: "Message not allowed" };
  }

  const modStatus = safetyResult.status === "needs_review" ? "pending" : "approved";
  const normalizedBody = normalizePostBody(parsed.data.body, 1000);

  const { data: msg, error } = await supabase
    .from("cricket_match_thread_messages")
    .insert({
      thread_id: parsed.data.thread_id,
      match_id: parsed.data.match_id ?? null,
      author_user_id: user.id,
      body: normalizedBody,
      message_type: parsed.data.message_type,
      moderation_status: modStatus,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to post message" };

  const warnings: string[] = [];
  if (modStatus === "pending") {
    warnings.push("Your message is pending moderation review");
  }

  return { success: true, data: { id: msg.id as string }, warnings };
}

export async function editMatchThreadMessage(
  messageId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateThreadMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: msg } = await supabase
    .from("cricket_match_thread_messages")
    .select("author_user_id, deleted_at")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return { success: false, error: "Message not found" };
  if (msg.deleted_at) return { success: false, error: "Message has been deleted" };
  if ((msg.author_user_id as string) !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_match_thread_messages")
    .update({
      body: normalizePostBody(parsed.data.body, 1000),
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (error) return { success: false, error: "Failed to edit message" };
  return { success: true };
}

export async function deleteMatchThreadMessage(messageId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: msg } = await supabase
    .from("cricket_match_thread_messages")
    .select("author_user_id, thread_id")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg) return { success: false, error: "Message not found" };

  const isAuthor = (msg.author_user_id as string) === user.id;
  let isModerator = false;

  const { data: thread } = await supabase
    .from("cricket_match_threads")
    .select("league_id")
    .eq("id", msg.thread_id)
    .maybeSingle();

  if (thread?.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: thread.league_id,
      p_user_id: user.id,
    });
    isModerator = Boolean(canMod);
  }

  if (!isAuthor && !isModerator) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_match_thread_messages")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) return { success: false, error: "Failed to delete message" };
  return { success: true };
}

export async function lockMatchThread(threadId: string): Promise<ActionResult> {
  return _setThreadStatus(threadId, "locked");
}

export async function unlockMatchThread(threadId: string): Promise<ActionResult> {
  return _setThreadStatus(threadId, "open");
}

async function _setThreadStatus(threadId: string, status: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: thread } = await supabase
    .from("cricket_match_threads")
    .select("league_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return { success: false, error: "Thread not found" };

  if (thread.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: thread.league_id,
      p_user_id: user.id,
    });
    if (!canMod) return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_match_threads")
    .update({ status })
    .eq("id", threadId);

  if (error) return { success: false, error: "Failed to update thread status" };
  return { success: true };
}
