/**
 * lib/cricket/validation/community.ts
 * Zod schemas for community posts, comments, and spaces.
 */

import { z } from "zod";

const UUID = z.string().uuid();

const MAX_POST_LENGTH = parseInt(process.env.CRICKET_MAX_POST_LENGTH ?? "3000", 10);
const MAX_COMMENT_LENGTH = parseInt(process.env.CRICKET_MAX_COMMENT_LENGTH ?? "1000", 10);

// Reject strings that contain obvious HTML/script injection attempts.
const NO_RAW_HTML = z
  .string()
  .refine((v) => !/<\s*(script|iframe|object|embed|form|input|button)/i.test(v), {
    message: "HTML tags are not allowed",
  });

export const POST_TYPES = [
  "post",
  "announcement",
  "match_update",
  "news",
  "article",
  "poll_share",
  "highlight",
  "broadcast_update",
  "result_update",
  "admin_notice",
] as const;

export const VISIBILITY_VALUES = [
  "private",
  "league",
  "team",
  "unlisted",
  "public",
] as const;

export const SPACE_TYPES = [
  "league",
  "team",
  "match",
  "broadcast",
  "announcement_board",
  "discussion",
  "news",
] as const;

export const POSTING_POLICIES = [
  "admins_only",
  "managers_only",
  "members",
  "verified_players",
  "public_disabled",
] as const;

export const COMMENTING_POLICIES = [
  "disabled",
  "admins_only",
  "members",
  "public_authenticated",
] as const;

export const MODERATION_POLICIES = [
  "pre_moderation",
  "post_moderation",
  "admins_only",
] as const;

// ─── Community space schema ───────────────────────────────────────────────────

export const createCommunitySpaceSchema = z.object({
  league_id: UUID.optional().nullable(),
  team_id: UUID.optional().nullable(),
  match_id: UUID.optional().nullable(),
  space_type: z.enum(SPACE_TYPES),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(VISIBILITY_VALUES).default("league"),
  posting_policy: z.enum(POSTING_POLICIES).default("members"),
  commenting_policy: z.enum(COMMENTING_POLICIES).default("members"),
  moderation_policy: z.enum(MODERATION_POLICIES).default("post_moderation"),
});

export type CreateCommunitySpaceInput = z.infer<typeof createCommunitySpaceSchema>;

export const updateCommunitySpaceSchema = createCommunitySpaceSchema
  .omit({ league_id: true, team_id: true, match_id: true, space_type: true, slug: true })
  .partial();

export type UpdateCommunitySpaceInput = z.infer<typeof updateCommunitySpaceSchema>;

// ─── Post schema ─────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  space_id: UUID.optional().nullable(),
  league_id: UUID.optional().nullable(),
  team_id: UUID.optional().nullable(),
  match_id: UUID.optional().nullable(),
  post_type: z.enum(POST_TYPES).default("post"),
  title: z
    .string()
    .max(160, "Title must be 160 characters or fewer")
    .optional()
    .nullable()
    .refine((v) => !v || !/<\s*(script|iframe|object|embed)/i.test(v), {
      message: "HTML tags are not allowed in title",
    }),
  body: NO_RAW_HTML.min(1, "Post body is required").max(
    MAX_POST_LENGTH,
    `Post body must be ${MAX_POST_LENGTH} characters or fewer`
  ),
  media_urls: z
    .array(z.string().url("Each media URL must be a valid URL"))
    .max(10)
    .default([]),
  link_url: z.string().url("Link must be a valid URL").optional().nullable(),
  visibility: z.enum(VISIBILITY_VALUES).default("league"),
  allow_comments: z.boolean().default(true),
  pinned: z.boolean().optional().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema
  .omit({ space_id: true, league_id: true, team_id: true, match_id: true })
  .partial();

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ─── Comment schema ───────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  post_id: UUID,
  parent_comment_id: UUID.optional().nullable(),
  body: NO_RAW_HTML.min(1, "Comment body is required").max(
    MAX_COMMENT_LENGTH,
    `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`
  ),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: NO_RAW_HTML.min(1).max(MAX_COMMENT_LENGTH),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// ─── Reaction schema ──────────────────────────────────────────────────────────

export const REACTION_TYPES = ["like", "love", "clap", "fire", "wow", "support"] as const;
export const REACTION_TARGET_TYPES = ["post", "comment", "match", "player", "team"] as const;

export const reactionSchema = z.object({
  target_type: z.enum(REACTION_TARGET_TYPES),
  target_id: UUID,
  reaction_type: z.enum(REACTION_TYPES).default("like"),
});

export type ReactionInput = z.infer<typeof reactionSchema>;

// ─── Follow schema ────────────────────────────────────────────────────────────

export const FOLLOW_TARGET_TYPES = ["league", "team", "player", "match"] as const;

export const followSchema = z.object({
  target_type: z.enum(FOLLOW_TARGET_TYPES),
  target_id: UUID,
});

export type FollowInput = z.infer<typeof followSchema>;
