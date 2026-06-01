import { randomBytes } from "crypto";

/**
 * Generates a cryptographically secure, URL-safe share token.
 * Format: giq_<24 base64url chars>
 * Total length: 28 characters — long enough to prevent enumeration.
 */
export function generateShareToken(): string {
  // 18 bytes → 24 base64url chars (no padding needed for base64url)
  const raw = randomBytes(18).toString("base64url");
  return `giq_${raw}`;
}
