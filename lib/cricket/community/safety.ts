/**
 * lib/cricket/community/safety.ts
 * Pure content safety and sanitization utilities for community content.
 * No external dependencies — deterministic and testable.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentSafetyStatus = "clean" | "needs_review" | "blocked";

export interface ContentSafetyResult {
  status: ContentSafetyStatus;
  reasons: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LINK_COUNT = 5;

// Script/html injection patterns that should block outright.
const BLOCKED_PATTERNS: RegExp[] = [
  /<\s*script/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /<\s*form/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,          // onclick=, onmouseover=, etc.
  /data\s*:\s*text\/html/i,
];

// Patterns that flag for review rather than outright blocking.
const REVIEW_PATTERNS: RegExp[] = [
  /<[a-z]/i,             // any remaining HTML-like tag
];

// Primitive URL detector (not meant to extract every valid URL, just count obvious ones).
const URL_PATTERN = /https?:\/\/\S+/gi;

// Repeated-character spam: e.g. "aaaaaaaaaa" or "!!!!!!!!!!!!!!"
const REPEATED_CHAR_PATTERN = /(.)\1{9,}/;

// ─── stripUnsafeHtml ──────────────────────────────────────────────────────────

/**
 * Returns the input with HTML tags stripped.
 * Does not sanitize to "safe HTML" — strips completely to plain text.
 */
export function stripUnsafeHtml(input: string): string {
  // Remove all <tag...> and </tag> patterns.
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;[^&]*&gt;/g, "")
    .trim();
}

// ─── normalizePostBody ────────────────────────────────────────────────────────

/**
 * Trims, normalizes whitespace, and enforces max length.
 */
export function normalizePostBody(input: string, maxLength = 3000): string {
  return input
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .slice(0, maxLength);
}

// ─── detectPotentiallyUnsafeContent ──────────────────────────────────────────

/**
 * Lightweight deterministic content safety check.
 * Returns a status and reasons list.
 * Does NOT rely on external services.
 */
export function detectPotentiallyUnsafeContent(input: string): ContentSafetyResult {
  const reasons: string[] = [];
  let status: ContentSafetyStatus = "clean";

  if (!input || !input.trim()) {
    return { status: "blocked", reasons: ["Empty content"] };
  }

  // Check hard-blocked patterns.
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      reasons.push(`Potentially unsafe content detected (pattern: ${pattern.source})`);
      status = "blocked";
    }
  }

  if (status === "blocked") {
    return { status, reasons };
  }

  // Check soft review patterns.
  for (const pattern of REVIEW_PATTERNS) {
    if (pattern.test(input)) {
      reasons.push("Content contains HTML-like markup");
      status = "needs_review";
    }
  }

  // Too many links.
  const linkMatches = input.match(URL_PATTERN) ?? [];
  if (linkMatches.length > MAX_LINK_COUNT) {
    reasons.push(`Too many links (${linkMatches.length} found, max ${MAX_LINK_COUNT})`);
    if (status === "clean") status = "needs_review";
  }

  // Repeated character spam.
  if (REPEATED_CHAR_PATTERN.test(input)) {
    reasons.push("Content appears to contain repeated character spam");
    if (status === "clean") status = "needs_review";
  }

  // Very short content (1–2 non-whitespace chars) with lots of repetition.
  const nonWhitespace = input.replace(/\s/g, "");
  if (nonWhitespace.length > 10 && new Set(nonWhitespace.toLowerCase()).size <= 2) {
    reasons.push("Content appears spammy (very few unique characters)");
    if (status === "clean") status = "needs_review";
  }

  return { status, reasons };
}

// ─── shouldRequirePreModeration ──────────────────────────────────────────────

interface ModerationDecisionInput {
  spacePolicy: string;
  contentSafetyResult: ContentSafetyResult;
  authorRole?: string | null;
}

export interface ModerationDecision {
  requiresPreModeration: boolean;
  shouldBlock: boolean;
  reasons: string[];
}

/**
 * Determines whether content should be pre-moderated or blocked.
 */
export function shouldRequirePreModeration(
  input: ModerationDecisionInput
): ModerationDecision {
  const { spacePolicy, contentSafetyResult, authorRole } = input;
  const reasons: string[] = [];

  if (contentSafetyResult.status === "blocked") {
    return {
      requiresPreModeration: false,
      shouldBlock: true,
      reasons: contentSafetyResult.reasons,
    };
  }

  let requiresPreModeration = false;

  if (spacePolicy === "pre_moderation") {
    requiresPreModeration = true;
    reasons.push("Space requires pre-moderation");
  }

  if (contentSafetyResult.status === "needs_review") {
    requiresPreModeration = true;
    reasons.push(...contentSafetyResult.reasons);
  }

  // Admins and moderators bypass pre-moderation (blocked content is already returned above).
  if (
    authorRole &&
    ["owner", "admin", "manager", "moderator"].includes(authorRole) &&
    reasons.length > 0
  ) {
    requiresPreModeration = false;
    reasons.length = 0;
  }

  return { requiresPreModeration, shouldBlock: false, reasons };
}

// ─── sanitizeCommunityPayload ─────────────────────────────────────────────────

/**
 * Removes internal/private fields before sending a community payload to the client.
 */
export function sanitizeCommunityPayload<T extends Record<string, unknown>>(
  payload: T,
  privateFields: string[] = []
): Partial<T> {
  const defaultPrivateFields = [
    "service_role_key",
    "supabase_key",
    "auth_token",
    "password",
    "hashed_password",
    "reset_token",
    "invite_token",
  ];

  const allPrivateFields = new Set([...defaultPrivateFields, ...privateFields]);
  const result: Partial<T> = {};

  for (const key of Object.keys(payload)) {
    if (!allPrivateFields.has(key)) {
      result[key as keyof T] = payload[key] as T[keyof T];
    }
  }

  return result;
}

// ─── buildCommunityExcerpt ────────────────────────────────────────────────────

/**
 * Returns a plain-text excerpt of the body, truncated at maxLength with ellipsis.
 */
export function buildCommunityExcerpt(body: string, maxLength = 160): string {
  const stripped = stripUnsafeHtml(body).replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength - 1).trimEnd() + "…";
}
