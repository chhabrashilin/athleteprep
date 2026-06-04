/**
 * tests/unit/community-safety.test.ts
 * Unit tests for content safety and sanitization utilities.
 */

import { describe, it, expect } from "vitest";
import {
  stripUnsafeHtml,
  normalizePostBody,
  detectPotentiallyUnsafeContent,
  shouldRequirePreModeration,
  sanitizeCommunityPayload,
  buildCommunityExcerpt,
} from "@/lib/cricket/community/safety";

// ─── stripUnsafeHtml ──────────────────────────────────────────────────────────

describe("stripUnsafeHtml", () => {
  it("strips script tags", () => {
    expect(stripUnsafeHtml('<script>alert("xss")</script>')).not.toContain("<script>");
  });

  it("strips anchor tags but keeps text", () => {
    expect(stripUnsafeHtml('<a href="evil.com">click</a>')).toBe("click");
  });

  it("strips iframe tags", () => {
    expect(stripUnsafeHtml('<iframe src="evil.com"></iframe>')).not.toContain("<iframe>");
  });

  it("leaves plain text unchanged", () => {
    expect(stripUnsafeHtml("Hello, world!")).toBe("Hello, world!");
  });

  it("trims whitespace", () => {
    expect(stripUnsafeHtml("  text  ")).toBe("text");
  });
});

// ─── normalizePostBody ────────────────────────────────────────────────────────

describe("normalizePostBody", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizePostBody("  hello  ")).toBe("hello");
  });

  it("collapses multiple spaces into one", () => {
    expect(normalizePostBody("hello   world")).toBe("hello world");
  });

  it("enforces max length", () => {
    const result = normalizePostBody("x".repeat(5000), 100);
    expect(result.length).toBe(100);
  });

  it("normalizes CRLF to LF", () => {
    expect(normalizePostBody("line1\r\nline2")).toBe("line1\nline2");
  });
});

// ─── detectPotentiallyUnsafeContent ──────────────────────────────────────────

describe("detectPotentiallyUnsafeContent", () => {
  it("returns clean for safe text", () => {
    const result = detectPotentiallyUnsafeContent("Great match today!");
    expect(result.status).toBe("clean");
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks script tag", () => {
    const result = detectPotentiallyUnsafeContent('<script>alert(1)</script>');
    expect(result.status).toBe("blocked");
  });

  it("blocks javascript: protocol", () => {
    const result = detectPotentiallyUnsafeContent("javascript:void(0)");
    expect(result.status).toBe("blocked");
  });

  it("blocks inline event handlers", () => {
    const result = detectPotentiallyUnsafeContent('<img onclick="evil()">');
    expect(result.status).toBe("blocked");
  });

  it("flags repeated character spam", () => {
    const result = detectPotentiallyUnsafeContent("aaaaaaaaaaaaa");
    expect(result.status).toBe("needs_review");
    expect(result.reasons.some((r) => r.includes("spam"))).toBe(true);
  });

  it("flags too many links", () => {
    const links = Array(6).fill("https://example.com/link").join(" ");
    const result = detectPotentiallyUnsafeContent(links);
    expect(result.status).toBe("needs_review");
    expect(result.reasons.some((r) => r.includes("links"))).toBe(true);
  });

  it("returns blocked for empty content", () => {
    const result = detectPotentiallyUnsafeContent("   ");
    expect(result.status).toBe("blocked");
  });

  it("flags HTML-like markup for review", () => {
    const result = detectPotentiallyUnsafeContent("<b>bold text</b>");
    expect(result.status).toBe("needs_review");
  });
});

// ─── shouldRequirePreModeration ──────────────────────────────────────────────

describe("shouldRequirePreModeration", () => {
  it("blocks content that failed safety check", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "post_moderation",
      contentSafetyResult: { status: "blocked", reasons: ["Unsafe content"] },
    });
    expect(result.shouldBlock).toBe(true);
    expect(result.requiresPreModeration).toBe(false);
  });

  it("requires pre-moderation for pre_moderation space policy", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "pre_moderation",
      contentSafetyResult: { status: "clean", reasons: [] },
    });
    expect(result.requiresPreModeration).toBe(true);
    expect(result.shouldBlock).toBe(false);
  });

  it("requires pre-moderation if content needs review", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "post_moderation",
      contentSafetyResult: { status: "needs_review", reasons: ["spam"] },
    });
    expect(result.requiresPreModeration).toBe(true);
  });

  it("allows clean content through post_moderation space without pre-mod", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "post_moderation",
      contentSafetyResult: { status: "clean", reasons: [] },
    });
    expect(result.requiresPreModeration).toBe(false);
    expect(result.shouldBlock).toBe(false);
  });

  it("bypasses pre-moderation for admin/moderator", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "pre_moderation",
      contentSafetyResult: { status: "needs_review", reasons: ["spam"] },
      authorRole: "admin",
    });
    expect(result.requiresPreModeration).toBe(false);
  });

  it("still blocks admin content if safety returns blocked", () => {
    const result = shouldRequirePreModeration({
      spacePolicy: "pre_moderation",
      contentSafetyResult: { status: "blocked", reasons: ["Script injection"] },
      authorRole: "admin",
    });
    expect(result.shouldBlock).toBe(true);
  });
});

// ─── sanitizeCommunityPayload ─────────────────────────────────────────────────

describe("sanitizeCommunityPayload", () => {
  it("removes default private fields", () => {
    const payload = {
      id: "123",
      title: "Hello",
      auth_token: "secret",
      password: "hunter2",
    };
    const result = sanitizeCommunityPayload(payload);
    expect(result).not.toHaveProperty("auth_token");
    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
  });

  it("removes custom private fields", () => {
    const payload = { id: "123", internal_ref: "hidden", title: "Public" };
    const result = sanitizeCommunityPayload(payload, ["internal_ref"]);
    expect(result).not.toHaveProperty("internal_ref");
    expect(result).toHaveProperty("title");
  });
});

// ─── buildCommunityExcerpt ────────────────────────────────────────────────────

describe("buildCommunityExcerpt", () => {
  it("returns full text if under maxLength", () => {
    expect(buildCommunityExcerpt("Short text", 160)).toBe("Short text");
  });

  it("truncates to maxLength with ellipsis", () => {
    const long = "x".repeat(200);
    const result = buildCommunityExcerpt(long, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith("…")).toBe(true);
  });

  it("strips HTML before excerpting", () => {
    const result = buildCommunityExcerpt('<b>Bold text</b>', 160);
    expect(result).not.toContain("<b>");
    expect(result).toContain("Bold text");
  });

  it("collapses whitespace", () => {
    const result = buildCommunityExcerpt("word1   word2   word3", 160);
    expect(result).toBe("word1 word2 word3");
  });
});
