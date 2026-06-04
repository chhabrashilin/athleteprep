"use server";

/**
 * lib/cricket/community/actions.ts
 * Server actions for community posts, comments, reactions, and follows.
 * All mutations require authentication and validate authorization.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  createCommunitySpaceSchema,
  updateCommunitySpaceSchema,
  reactionSchema,
  followSchema,
} from "@/lib/cricket/validation/community";
import {
  detectPotentiallyUnsafeContent,
  shouldRequirePreModeration,
  normalizePostBody,
  stripUnsafeHtml,
} from "@/lib/cricket/community/safety";
import { createCricketNotification } from "@/lib/cricket/notifications/actions";

// ─── Result type ──────────────────────────────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// ─── Community Space ──────────────────────────────────────────────────────────

export async function createCricketCommunitySpace(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createCommunitySpaceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  if (d.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: d.league_id,
      p_user_id: user.id,
    });
    if (!canMod) return { success: false, error: "Not authorized to manage this league" };
  }

  const { data, error } = await supabase
    .from("cricket_community_spaces")
    .insert({ ...d, created_by: user.id })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create community space" };
  return { success: true, data: { id: data.id as string } };
}

export async function updateCricketCommunitySpace(
  spaceId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateCommunitySpaceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: space } = await supabase
    .from("cricket_community_spaces")
    .select("league_id")
    .eq("id", spaceId)
    .maybeSingle();

  if (!space) return { success: false, error: "Space not found" };

  if (space.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: space.league_id,
      p_user_id: user.id,
    });
    if (!canMod) return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_community_spaces")
    .update(parsed.data)
    .eq("id", spaceId);

  if (error) return { success: false, error: "Failed to update space" };
  return { success: true };
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function createCricketPost(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  // Check space posting permission.
  if (d.space_id) {
    const { data: canPost } = await supabase.rpc("user_can_post_in_cricket_space", {
      p_space_id: d.space_id,
      p_user_id: user.id,
    });
    if (!canPost) return { success: false, error: "Not authorized to post in this space" };
  }

  // Fetch space moderation policy.
  let moderationPolicy = "post_moderation";
  if (d.space_id) {
    const { data: spaceRow } = await supabase
      .from("cricket_community_spaces")
      .select("moderation_policy")
      .eq("id", d.space_id)
      .maybeSingle();
    if (spaceRow) moderationPolicy = spaceRow.moderation_policy as string;
  }

  const normalizedBody = normalizePostBody(d.body);
  const safetyResult = detectPotentiallyUnsafeContent(normalizedBody);
  const { shouldBlock, requiresPreModeration } = shouldRequirePreModeration({
    spacePolicy: moderationPolicy,
    contentSafetyResult: safetyResult,
  });

  if (shouldBlock) {
    return { success: false, error: "Content not allowed" };
  }

  const moderationStatus = requiresPreModeration ? "pending" : "approved";

  const { data, error } = await supabase
    .from("cricket_posts")
    .insert({
      space_id: d.space_id ?? null,
      league_id: d.league_id ?? null,
      team_id: d.team_id ?? null,
      match_id: d.match_id ?? null,
      author_user_id: user.id,
      post_type: d.post_type,
      title: d.title ? stripUnsafeHtml(d.title) : null,
      body: normalizedBody,
      media_urls: d.media_urls ?? [],
      link_url: d.link_url ?? null,
      visibility: d.visibility,
      status: "published",
      allow_comments: d.allow_comments,
      pinned: d.pinned ?? false,
      moderation_status: moderationStatus,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create post" };

  const warnings: string[] = [];
  if (requiresPreModeration) {
    warnings.push("Your post is pending moderation review");
  }

  // Notify league followers of announcements.
  if (d.post_type === "announcement" && d.league_id && moderationStatus === "approved") {
    void notifyLeagueFollowersOfAnnouncement(d.league_id, data.id as string, d.title ?? "New announcement", user.id);
  }

  return { success: true, data: { id: data.id as string }, warnings };
}

async function notifyLeagueFollowersOfAnnouncement(
  leagueId: string,
  postId: string,
  title: string,
  actorId: string
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return;

  const { data: followers } = await supabase
    .from("cricket_follows")
    .select("user_id")
    .eq("target_type", "league")
    .eq("target_id", leagueId);

  if (!followers?.length) return;

  const notifications = followers
    .filter((f) => (f.user_id as string) !== actorId)
    .map((f) => ({
      recipient_user_id: f.user_id as string,
      actor_user_id: actorId,
      league_id: leagueId,
      notification_type: "announcement.created" as const,
      title: `New announcement: ${title.slice(0, 80)}`,
      action_url: `/cricket/news/${postId}`,
    }));

  if (notifications.length) {
    for (const n of notifications) {
      await createCricketNotification(n);
    }
  }
}

export async function updateCricketPost(
  postId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: post } = await supabase
    .from("cricket_posts")
    .select("author_user_id, league_id, deleted_at")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { success: false, error: "Post not found" };
  if (post.deleted_at) return { success: false, error: "Post has been deleted" };

  const isAuthor = (post.author_user_id as string) === user.id;
  let isModerator = false;
  if (post.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: post.league_id,
      p_user_id: user.id,
    });
    isModerator = Boolean(canMod);
  }

  if (!isAuthor && !isModerator) {
    return { success: false, error: "Not authorized" };
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.body) {
    updateData.body = normalizePostBody(parsed.data.body);
    updateData.edited_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("cricket_posts")
    .update(updateData)
    .eq("id", postId);

  if (error) return { success: false, error: "Failed to update post" };
  return { success: true };
}

export async function deleteCricketPost(postId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: post } = await supabase
    .from("cricket_posts")
    .select("author_user_id, league_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post) return { success: false, error: "Post not found" };

  const isAuthor = (post.author_user_id as string) === user.id;
  let isModerator = false;
  if (post.league_id) {
    const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
      p_league_id: post.league_id,
      p_user_id: user.id,
    });
    isModerator = Boolean(canMod);
  }

  if (!isAuthor && !isModerator) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_posts")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) return { success: false, error: "Failed to delete post" };
  return { success: true };
}

export async function pinCricketPost(postId: string): Promise<ActionResult> {
  return _setPinStatus(postId, true);
}

export async function unpinCricketPost(postId: string): Promise<ActionResult> {
  return _setPinStatus(postId, false);
}

async function _setPinStatus(postId: string, pinned: boolean): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: post } = await supabase
    .from("cricket_posts")
    .select("league_id")
    .eq("id", postId)
    .maybeSingle();

  if (!post?.league_id) return { success: false, error: "Post not found" };

  const { data: canMod } = await supabase.rpc("user_can_moderate_cricket_league", {
    p_league_id: post.league_id,
    p_user_id: user.id,
  });
  if (!canMod) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_posts")
    .update({ pinned })
    .eq("id", postId);

  if (error) return { success: false, error: "Failed to update pin status" };
  return { success: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function createCricketComment(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: post } = await supabase
    .from("cricket_posts")
    .select("allow_comments, status, author_user_id, space_id, league_id")
    .eq("id", parsed.data.post_id)
    .maybeSingle();

  if (!post) return { success: false, error: "Post not found" };
  if (post.status !== "published") return { success: false, error: "Cannot comment on this post" };
  if (!post.allow_comments) return { success: false, error: "Comments are disabled on this post" };

  const safetyResult = detectPotentiallyUnsafeContent(parsed.data.body);
  if (safetyResult.status === "blocked") {
    return { success: false, error: "Comment not allowed" };
  }

  const modStatus = safetyResult.status === "needs_review" ? "pending" : "approved";

  const { data, error } = await supabase
    .from("cricket_comments")
    .insert({
      post_id: parsed.data.post_id,
      parent_comment_id: parsed.data.parent_comment_id ?? null,
      author_user_id: user.id,
      body: normalizePostBody(parsed.data.body, 1000),
      moderation_status: modStatus,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create comment" };

  // Notify post author of new comment.
  const postAuthorId = post.author_user_id as string | null;
  if (postAuthorId && postAuthorId !== user.id) {
    await createCricketNotification({
      recipient_user_id: postAuthorId,
      actor_user_id: user.id,
      league_id: (post.league_id as string | null) ?? undefined,
      notification_type: "post.comment",
      title: "Someone commented on your post",
      action_url: `/cricket/news/${parsed.data.post_id}`,
    });
  }

  return { success: true, data: { id: data.id as string } };
}

export async function updateCricketComment(
  commentId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: comment } = await supabase
    .from("cricket_comments")
    .select("author_user_id, deleted_at")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment) return { success: false, error: "Comment not found" };
  if (comment.deleted_at) return { success: false, error: "Comment has been deleted" };
  if ((comment.author_user_id as string) !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_comments")
    .update({ body: normalizePostBody(parsed.data.body, 1000), edited_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) return { success: false, error: "Failed to update comment" };
  return { success: true };
}

export async function deleteCricketComment(commentId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: comment } = await supabase
    .from("cricket_comments")
    .select("author_user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment) return { success: false, error: "Comment not found" };
  if ((comment.author_user_id as string) !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_comments")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) return { success: false, error: "Failed to delete comment" };
  return { success: true };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function reactToCricketTarget(input: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase.from("cricket_reactions").upsert({
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    user_id: user.id,
    reaction_type: parsed.data.reaction_type,
  });

  if (error) return { success: false, error: "Failed to add reaction" };
  return { success: true };
}

export async function removeCricketReaction(input: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_reactions")
    .delete()
    .eq("target_type", parsed.data.target_type)
    .eq("target_id", parsed.data.target_id)
    .eq("user_id", user.id)
    .eq("reaction_type", parsed.data.reaction_type);

  if (error) return { success: false, error: "Failed to remove reaction" };
  return { success: true };
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export async function followCricketTarget(input: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase.from("cricket_follows").upsert({
    user_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
  });

  if (error) return { success: false, error: "Failed to follow" };
  return { success: true };
}

export async function unfollowCricketTarget(input: unknown): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = followSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("target_type", parsed.data.target_type)
    .eq("target_id", parsed.data.target_id);

  if (error) return { success: false, error: "Failed to unfollow" };
  return { success: true };
}
