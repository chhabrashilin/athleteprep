/**
 * lib/cricket/overlays/tokens.ts
 * Overlay token generation, hashing, and verification.
 *
 * Security model:
 *   - Raw token: shown once to the operator; never stored.
 *   - Token hash: stored in DB (cricket_overlay_tokens.token_hash).
 *   - Token prefix: first 8 chars of raw token; stored for display/debug only.
 *   - Overlay URL includes the raw token as ?token=<raw>.
 *   - Server verifies by hashing the incoming token and comparing to stored hash.
 */

import { createHash, randomBytes } from "crypto";

const TOKEN_BYTES = 32;
const PREFIX_LENGTH = 8;

// ─── generateOverlayToken ─────────────────────────────────────────────────────

export function generateOverlayToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

// ─── hashOverlayToken ─────────────────────────────────────────────────────────

export function hashOverlayToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── getTokenPrefix ───────────────────────────────────────────────────────────

export function getTokenPrefix(token: string): string {
  return token.slice(0, PREFIX_LENGTH);
}

// ─── verifyOverlayToken ───────────────────────────────────────────────────────

export function verifyOverlayToken(rawToken: string, storedHash: string): boolean {
  const computed = hashOverlayToken(rawToken);
  if (computed.length !== storedHash.length) return false;

  // Constant-time comparison to prevent timing attacks.
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

// ─── buildOverlayUrl ─────────────────────────────────────────────────────────

export type OverlayType =
  | "scorebug"
  | "full-scorecard"
  | "lower-third"
  | "toss"
  | "innings-break"
  | "result"
  | "minimal";

export function buildOverlayUrl(
  matchSlugOrId: string,
  rawToken: string,
  overlayType: OverlayType,
  baseUrl?: string
): string {
  const base = baseUrl ?? (
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : "http://localhost:3000"
  );
  return `${base}/cricket/overlays/${encodeURIComponent(matchSlugOrId)}/${overlayType}?token=${encodeURIComponent(rawToken)}`;
}
