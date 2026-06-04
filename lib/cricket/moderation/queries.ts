/**
 * lib/cricket/moderation/queries.ts
 * Data access for community moderation: reports, queue, actions.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CricketReport {
  id: string;
  reporterUserId: string | null;
  targetType: string;
  targetId: string;
  leagueId: string | null;
  reason: string;
  details: string | null;
  status: string;
  assignedTo: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketModerationAction {
  id: string;
  leagueId: string | null;
  moderatorUserId: string | null;
  targetType: string;
  targetId: string;
  action: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

function rowToReport(row: Record<string, unknown>): CricketReport {
  return {
    id: row.id as string,
    reporterUserId: (row.reporter_user_id as string | null) ?? null,
    targetType: row.target_type as string,
    targetId: row.target_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    reason: row.reason as string,
    details: (row.details as string | null) ?? null,
    status: row.status as string,
    assignedTo: (row.assigned_to as string | null) ?? null,
    resolvedBy: (row.resolved_by as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    resolutionNotes: (row.resolution_notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToModerationAction(row: Record<string, unknown>): CricketModerationAction {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    moderatorUserId: (row.moderator_user_id as string | null) ?? null,
    targetType: row.target_type as string,
    targetId: row.target_id as string,
    action: row.action as string,
    reason: (row.reason as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getCricketReportsForLeague(
  leagueId: string,
  status?: string
): Promise<CricketReport[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_reports")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return (data ?? []).map(rowToReport);
}

export async function getCricketModerationQueue(leagueId: string): Promise<{
  pendingPosts: Array<{ id: string; title: string | null; body: string; createdAt: string }>;
  pendingComments: Array<{ id: string; body: string; createdAt: string }>;
  flaggedMessages: Array<{ id: string; body: string; createdAt: string }>;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { pendingPosts: [], pendingComments: [], flaggedMessages: [] };

  const [{ data: postsData }, { data: commentsData }, { data: messagesData }] = await Promise.all([
    supabase
      .from("cricket_posts")
      .select("id, title, body, created_at")
      .eq("league_id", leagueId)
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("cricket_comments")
      .select("id, body, created_at, post_id")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("cricket_match_thread_messages")
      .select("id, body, created_at")
      .eq("moderation_status", "flagged")
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  return {
    pendingPosts: (postsData ?? []).map((r) => ({
      id: r.id as string,
      title: (r.title as string | null) ?? null,
      body: r.body as string,
      createdAt: r.created_at as string,
    })),
    pendingComments: (commentsData ?? []).map((r) => ({
      id: r.id as string,
      body: r.body as string,
      createdAt: r.created_at as string,
    })),
    flaggedMessages: (messagesData ?? []).map((r) => ({
      id: r.id as string,
      body: r.body as string,
      createdAt: r.created_at as string,
    })),
  };
}

export async function getCricketModerationActions(
  leagueId: string,
  limit = 50
): Promise<CricketModerationAction[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_moderation_actions")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(rowToModerationAction);
}
