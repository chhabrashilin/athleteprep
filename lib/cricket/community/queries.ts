/**
 * lib/cricket/community/queries.ts
 * Read-only data access for community spaces, posts, and comments.
 * Call only from Server Components, Server Actions, or Route Handlers.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface CricketCommunitySpace {
  id: string;
  leagueId: string | null;
  teamId: string | null;
  matchId: string | null;
  spaceType: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  postingPolicy: string;
  commentingPolicy: string;
  moderationPolicy: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CricketPost {
  id: string;
  spaceId: string | null;
  leagueId: string | null;
  teamId: string | null;
  matchId: string | null;
  authorUserId: string | null;
  authorPlayerId: string | null;
  postType: string;
  title: string | null;
  body: string;
  mediaUrls: string[];
  linkUrl: string | null;
  visibility: string;
  status: string;
  pinned: boolean;
  featured: boolean;
  allowComments: boolean;
  moderationStatus: string;
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
  reactionCount?: number;
  commentCount?: number;
}

export interface CricketComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorUserId: string | null;
  body: string;
  status: string;
  moderationStatus: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: CricketComment[];
}

// ─── Row transforms ───────────────────────────────────────────────────────────

function rowToSpace(row: Record<string, unknown>): CricketCommunitySpace {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    spaceType: row.space_type as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    visibility: row.visibility as string,
    postingPolicy: row.posting_policy as string,
    commentingPolicy: row.commenting_policy as string,
    moderationPolicy: row.moderation_policy as string,
    isActive: row.is_active as boolean,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPost(row: Record<string, unknown>): CricketPost {
  return {
    id: row.id as string,
    spaceId: (row.space_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    authorUserId: (row.author_user_id as string | null) ?? null,
    authorPlayerId: (row.author_player_id as string | null) ?? null,
    postType: row.post_type as string,
    title: (row.title as string | null) ?? null,
    body: row.body as string,
    mediaUrls: (row.media_urls as string[]) ?? [],
    linkUrl: (row.link_url as string | null) ?? null,
    visibility: row.visibility as string,
    status: row.status as string,
    pinned: row.pinned as boolean,
    featured: row.featured as boolean,
    allowComments: row.allow_comments as boolean,
    moderationStatus: row.moderation_status as string,
    publishedAt: (row.published_at as string | null) ?? null,
    editedAt: (row.edited_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

function rowToComment(row: Record<string, unknown>): CricketComment {
  return {
    id: row.id as string,
    postId: row.post_id as string,
    parentCommentId: (row.parent_comment_id as string | null) ?? null,
    authorUserId: (row.author_user_id as string | null) ?? null,
    body: row.body as string,
    status: row.status as string,
    moderationStatus: row.moderation_status as string,
    editedAt: (row.edited_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCommunitySpacesForLeague(
  leagueId: string
): Promise<CricketCommunitySpace[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_community_spaces")
    .select("*")
    .eq("league_id", leagueId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (data ?? []).map(rowToSpace);
}

export async function getCommunitySpacesForTeam(
  teamId: string
): Promise<CricketCommunitySpace[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_community_spaces")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return (data ?? []).map(rowToSpace);
}

export async function getCommunitySpacesForMatch(
  matchId: string
): Promise<CricketCommunitySpace[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_community_spaces")
    .select("*")
    .eq("match_id", matchId)
    .eq("is_active", true);

  return (data ?? []).map(rowToSpace);
}

export async function getCricketCommunitySpace(
  spaceId: string
): Promise<CricketCommunitySpace | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_community_spaces")
    .select("*")
    .eq("id", spaceId)
    .maybeSingle();

  return data ? rowToSpace(data as Record<string, unknown>) : null;
}

export interface FeedScope {
  leagueId?: string;
  teamId?: string;
  matchId?: string;
  postType?: string;
  pinned?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCricketCommunityFeed(
  scope: FeedScope
): Promise<CricketPost[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_posts")
    .select("*")
    .eq("status", "published")
    .in("moderation_status", ["approved", "flagged"])
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });

  if (scope.leagueId) query = query.eq("league_id", scope.leagueId);
  if (scope.teamId) query = query.eq("team_id", scope.teamId);
  if (scope.matchId) query = query.eq("match_id", scope.matchId);
  if (scope.postType) query = query.eq("post_type", scope.postType);
  if (scope.pinned !== undefined) query = query.eq("pinned", scope.pinned);

  query = query.range(scope.offset ?? 0, (scope.offset ?? 0) + (scope.limit ?? 20) - 1);

  const { data } = await query;
  return (data ?? []).map(rowToPost);
}

export async function getCricketPost(postId: string): Promise<CricketPost | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();

  return data ? rowToPost(data as Record<string, unknown>) : null;
}

export async function getCricketPostComments(postId: string): Promise<CricketComment[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "published")
    .in("moderation_status", ["approved", "flagged"])
    .is("parent_comment_id", null)
    .order("created_at", { ascending: true });

  return (data ?? []).map(rowToComment);
}

export async function getPinnedPosts(scope: FeedScope): Promise<CricketPost[]> {
  return getCricketCommunityFeed({ ...scope, pinned: true, limit: 5 });
}

export async function userCanViewCommunitySpace(
  userId: string,
  spaceId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase.rpc("user_can_view_cricket_space", {
    p_space_id: spaceId,
    p_user_id: userId,
  });

  return Boolean(data);
}

export async function userCanPostInCommunitySpace(
  userId: string,
  spaceId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase.rpc("user_can_post_in_cricket_space", {
    p_space_id: spaceId,
    p_user_id: userId,
  });

  return Boolean(data);
}
