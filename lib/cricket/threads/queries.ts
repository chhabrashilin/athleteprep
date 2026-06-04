/**
 * lib/cricket/threads/queries.ts
 * Data access for cricket match threads and messages.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CricketMatchThread {
  id: string;
  matchId: string;
  leagueId: string | null;
  title: string;
  visibility: string;
  status: string;
  slowModeSeconds: number;
  pinnedMessage: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketThreadMessage {
  id: string;
  threadId: string;
  matchId: string | null;
  authorUserId: string | null;
  body: string;
  messageType: string;
  status: string;
  moderationStatus: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToThread(row: Record<string, unknown>): CricketMatchThread {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    title: row.title as string,
    visibility: row.visibility as string,
    status: row.status as string,
    slowModeSeconds: (row.slow_mode_seconds as number) ?? 0,
    pinnedMessage: (row.pinned_message as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToMessage(row: Record<string, unknown>): CricketThreadMessage {
  return {
    id: row.id as string,
    threadId: row.thread_id as string,
    matchId: (row.match_id as string | null) ?? null,
    authorUserId: (row.author_user_id as string | null) ?? null,
    body: row.body as string,
    messageType: row.message_type as string,
    status: row.status as string,
    moderationStatus: row.moderation_status as string,
    editedAt: (row.edited_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getCricketMatchThread(
  matchId: string
): Promise<CricketMatchThread | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_match_threads")
    .select("*")
    .eq("match_id", matchId)
    .not("status", "eq", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToThread(data as Record<string, unknown>) : null;
}

export async function getCricketThreadMessages(
  threadId: string,
  pagination: { limit?: number; offset?: number } = {}
): Promise<CricketThreadMessage[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const limit = pagination.limit ?? 50;
  const offset = pagination.offset ?? 0;

  const { data } = await supabase
    .from("cricket_match_thread_messages")
    .select("*")
    .eq("thread_id", threadId)
    .eq("status", "published")
    .in("moderation_status", ["approved", "flagged"])
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  return (data ?? []).map(rowToMessage);
}

export async function getRecentMatchThreadMessages(
  matchId: string,
  limit = 30
): Promise<CricketThreadMessage[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const thread = await getCricketMatchThread(matchId);
  if (!thread) return [];

  const { data } = await supabase
    .from("cricket_match_thread_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .eq("status", "published")
    .in("moderation_status", ["approved", "flagged"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []).map(rowToMessage)).reverse();
}
