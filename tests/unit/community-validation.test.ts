/**
 * tests/unit/community-validation.test.ts
 * Unit tests for community, poll, notification, and moderation validation schemas.
 */

import { describe, it, expect } from "vitest";
import { createPostSchema, createCommentSchema } from "@/lib/cricket/validation/community";
import { createPollSchema, calculatePollResults } from "@/lib/cricket/validation/polls";
import { createNotificationSchema } from "@/lib/cricket/validation/notifications";
import { createReportSchema, moderationActionSchema } from "@/lib/cricket/validation/moderation";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ─── Post schema ──────────────────────────────────────────────────────────────

describe("createPostSchema", () => {
  it("accepts a valid post", () => {
    const result = createPostSchema.safeParse({
      body: "This is a valid post body.",
      post_type: "post",
      visibility: "league",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = createPostSchema.safeParse({ body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects body exceeding max length", () => {
    const result = createPostSchema.safeParse({ body: "x".repeat(3001) });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 160 chars", () => {
    const result = createPostSchema.safeParse({
      body: "Valid body",
      title: "x".repeat(161),
    });
    expect(result.success).toBe(false);
  });

  it("rejects body with script tag", () => {
    const result = createPostSchema.safeParse({
      body: '<script>alert("xss")</script>',
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid media URL", () => {
    const result = createPostSchema.safeParse({
      body: "Valid body",
      media_urls: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid link URL", () => {
    const result = createPostSchema.safeParse({
      body: "Valid body",
      link_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid media URLs", () => {
    const result = createPostSchema.safeParse({
      body: "Valid body",
      media_urls: ["https://example.com/image.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid post_types", () => {
    for (const type of ["post", "announcement", "news", "article", "match_update"]) {
      const result = createPostSchema.safeParse({ body: "Valid body", post_type: type });
      expect(result.success).toBe(true);
    }
  });
});

// ─── Comment schema ───────────────────────────────────────────────────────────

describe("createCommentSchema", () => {
  it("accepts a valid comment", () => {
    const result = createCommentSchema.safeParse({
      post_id: VALID_UUID,
      body: "Great post!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = createCommentSchema.safeParse({ post_id: VALID_UUID, body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects body over 1000 chars", () => {
    const result = createCommentSchema.safeParse({
      post_id: VALID_UUID,
      body: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects body with iframe tag", () => {
    const result = createCommentSchema.safeParse({
      post_id: VALID_UUID,
      body: '<iframe src="evil.com"></iframe>',
    });
    expect(result.success).toBe(false);
  });

  it("accepts comment with parent_comment_id", () => {
    const result = createCommentSchema.safeParse({
      post_id: VALID_UUID,
      parent_comment_id: VALID_UUID,
      body: "Reply here",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Poll schema ──────────────────────────────────────────────────────────────

describe("createPollSchema", () => {
  const base = {
    question: "Who will win?",
    options: ["Team A", "Team B"],
  };

  it("accepts a valid poll", () => {
    expect(createPollSchema.safeParse(base).success).toBe(true);
  });

  it("rejects fewer than 2 options", () => {
    expect(createPollSchema.safeParse({ ...base, options: ["Only one"] }).success).toBe(false);
  });

  it("rejects more than 10 options", () => {
    expect(
      createPollSchema.safeParse({ ...base, options: Array(11).fill("Option") }).success
    ).toBe(false);
  });

  it("rejects duplicate options (case-insensitive)", () => {
    expect(
      createPollSchema.safeParse({ ...base, options: ["Team A", "team a"] }).success
    ).toBe(false);
  });

  it("rejects duplicate options with whitespace", () => {
    expect(
      createPollSchema.safeParse({ ...base, options: ["Team A", "  Team A  "] }).success
    ).toBe(false);
  });

  it("rejects question shorter than 5 chars", () => {
    expect(createPollSchema.safeParse({ ...base, question: "Who?" }).success).toBe(false);
  });

  it("rejects close date in the past", () => {
    expect(
      createPollSchema.safeParse({
        ...base,
        closes_at: new Date(Date.now() - 3600000).toISOString(),
      }).success
    ).toBe(false);
  });

  it("accepts future close date", () => {
    expect(
      createPollSchema.safeParse({
        ...base,
        closes_at: new Date(Date.now() + 3600000).toISOString(),
      }).success
    ).toBe(true);
  });
});

// ─── Poll result calculation ──────────────────────────────────────────────────

describe("calculatePollResults", () => {
  const opts = [
    { id: "opt-1", option_text: "Team A", sort_order: 0 },
    { id: "opt-2", option_text: "Team B", sort_order: 1 },
  ];

  it("calculates correct percentages", () => {
    const votes = [
      { option_id: "opt-1" },
      { option_id: "opt-1" },
      { option_id: "opt-2" },
    ];
    const results = calculatePollResults(opts, votes, []);
    expect(results[0].vote_count).toBe(2);
    expect(results[0].percentage).toBe(67);
    expect(results[1].vote_count).toBe(1);
    expect(results[1].percentage).toBe(33);
  });

  it("returns 0% for all options with no votes", () => {
    const results = calculatePollResults(opts, [], []);
    expect(results.every((r) => r.percentage === 0)).toBe(true);
  });

  it("sorts options by sort_order", () => {
    const reversed = [opts[1], opts[0]];
    const results = calculatePollResults(reversed, [], []);
    expect(results[0].option_id).toBe("opt-1");
  });
});

// ─── Notification schema ──────────────────────────────────────────────────────

describe("createNotificationSchema", () => {
  it("accepts a valid notification", () => {
    const result = createNotificationSchema.safeParse({
      recipient_user_id: VALID_UUID,
      notification_type: "announcement.created",
      title: "New announcement",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid notification_type", () => {
    const result = createNotificationSchema.safeParse({
      recipient_user_id: VALID_UUID,
      notification_type: "unknown.type",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID recipient", () => {
    const result = createNotificationSchema.safeParse({
      recipient_user_id: "not-a-uuid",
      notification_type: "post.comment",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid relative action_url", () => {
    const result = createNotificationSchema.safeParse({
      recipient_user_id: VALID_UUID,
      notification_type: "post.comment",
      title: "Test",
      action_url: "/cricket/leagues/my-league",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unsafe action_url", () => {
    const result = createNotificationSchema.safeParse({
      recipient_user_id: VALID_UUID,
      notification_type: "post.comment",
      title: "Test",
      action_url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});

// ─── Report schema ────────────────────────────────────────────────────────────

describe("createReportSchema", () => {
  it("accepts a valid report", () => {
    const result = createReportSchema.safeParse({
      target_type: "post",
      target_id: VALID_UUID,
      reason: "spam",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing reason", () => {
    const result = createReportSchema.safeParse({
      target_type: "post",
      target_id: VALID_UUID,
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid target_type", () => {
    const result = createReportSchema.safeParse({
      target_type: "user_account",
      target_id: VALID_UUID,
      reason: "harassment",
    });
    expect(result.success).toBe(false);
  });

  it("rejects details over 1000 chars", () => {
    const result = createReportSchema.safeParse({
      target_type: "comment",
      target_id: VALID_UUID,
      reason: "spam",
      details: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ─── Moderation action schema ─────────────────────────────────────────────────

describe("moderationActionSchema", () => {
  it("accepts a valid action", () => {
    const result = moderationActionSchema.safeParse({
      target_type: "post",
      target_id: VALID_UUID,
      action: "approve",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = moderationActionSchema.safeParse({
      target_type: "post",
      target_id: VALID_UUID,
      action: "delete_user",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid target_type", () => {
    const result = moderationActionSchema.safeParse({
      target_type: "user",
      target_id: VALID_UUID,
      action: "hide",
    });
    expect(result.success).toBe(false);
  });
});
