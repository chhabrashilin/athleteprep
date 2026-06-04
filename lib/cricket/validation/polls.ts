/**
 * lib/cricket/validation/polls.ts
 * Zod schemas for cricket fan polls.
 */

import { z } from "zod";

const UUID = z.string().uuid();

// ─── Poll schema ──────────────────────────────────────────────────────────────

export const createPollSchema = z
  .object({
    league_id: UUID.optional().nullable(),
    team_id: UUID.optional().nullable(),
    match_id: UUID.optional().nullable(),
    post_id: UUID.optional().nullable(),
    question: z
      .string()
      .min(5, "Poll question must be at least 5 characters")
      .max(200, "Poll question must be 200 characters or fewer"),
    options: z
      .array(
        z.string().min(1, "Option text is required").max(120, "Option must be 120 characters or fewer")
      )
      .min(2, "Polls must have at least 2 options")
      .max(10, "Polls can have at most 10 options"),
    visibility: z
      .enum(["private", "league", "team", "unlisted", "public"])
      .default("league"),
    allow_multiple_votes: z.boolean().default(false),
    allow_vote_change: z.boolean().default(true),
    show_results_before_close: z.boolean().default(true),
    closes_at: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.closes_at) return true;
      return new Date(data.closes_at) > new Date();
    },
    { message: "Poll close date must be in the future", path: ["closes_at"] }
  )
  .refine(
    (data) => {
      const normalized = data.options.map((o) => o.trim().toLowerCase());
      return new Set(normalized).size === normalized.length;
    },
    { message: "Poll options must be unique", path: ["options"] }
  );

export type CreatePollInput = z.infer<typeof createPollSchema>;

// ─── Vote schema ──────────────────────────────────────────────────────────────

export const pollVoteSchema = z.object({
  poll_id: UUID,
  option_ids: z
    .array(UUID)
    .min(1, "At least one option must be selected")
    .max(10),
});

export type PollVoteInput = z.infer<typeof pollVoteSchema>;

// ─── Poll close/archive ───────────────────────────────────────────────────────

export const pollIdSchema = z.object({
  poll_id: UUID,
});

export type PollIdInput = z.infer<typeof pollIdSchema>;

// ─── Poll result ──────────────────────────────────────────────────────────────

export interface PollOptionResult {
  option_id: string;
  option_text: string;
  sort_order: number;
  vote_count: number;
  percentage: number;
}

export interface PollResults {
  poll_id: string;
  question: string;
  total_votes: number;
  status: string;
  closes_at: string | null;
  options: PollOptionResult[];
  user_voted_option_ids: string[];
}

export function calculatePollResults(
  options: Array<{ id: string; option_text: string; sort_order: number }>,
  votes: Array<{ option_id: string }>,
  userVoteOptionIds: string[]
): PollOptionResult[] {
  const total = votes.length;
  const countMap = new Map<string, number>();
  for (const v of votes) {
    countMap.set(v.option_id, (countMap.get(v.option_id) ?? 0) + 1);
  }
  return options
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((opt) => {
      const count = countMap.get(opt.id) ?? 0;
      return {
        option_id: opt.id,
        option_text: opt.option_text,
        sort_order: opt.sort_order,
        vote_count: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
}
