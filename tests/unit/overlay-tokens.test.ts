/**
 * tests/unit/overlay-tokens.test.ts
 * Tests for overlay token generation, hashing, and verification.
 */

import { describe, it, expect } from "vitest";
import {
  generateOverlayToken,
  hashOverlayToken,
  getTokenPrefix,
  verifyOverlayToken,
  buildOverlayUrl,
} from "@/lib/cricket/overlays/tokens";

describe("generateOverlayToken", () => {
  it("generates a token of correct length (64 hex chars for 32 bytes)", () => {
    const token = generateOverlayToken();
    expect(token).toHaveLength(64);
  });

  it("generates unique tokens", () => {
    const t1 = generateOverlayToken();
    const t2 = generateOverlayToken();
    expect(t1).not.toBe(t2);
  });

  it("only contains hex characters", () => {
    const token = generateOverlayToken();
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });
});

describe("hashOverlayToken", () => {
  it("produces a 64-char sha256 hex hash", () => {
    const hash = hashOverlayToken("test-token");
    expect(hash).toHaveLength(64);
  });

  it("is deterministic", () => {
    expect(hashOverlayToken("abc")).toBe(hashOverlayToken("abc"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashOverlayToken("abc")).not.toBe(hashOverlayToken("def"));
  });
});

describe("getTokenPrefix", () => {
  it("returns the first 8 characters", () => {
    expect(getTokenPrefix("abcdefgh1234")).toBe("abcdefgh");
  });

  it("does not expose more than 8 chars", () => {
    const prefix = getTokenPrefix(generateOverlayToken());
    expect(prefix).toHaveLength(8);
  });
});

describe("verifyOverlayToken", () => {
  it("verifies a correct token", () => {
    const token = generateOverlayToken();
    const hash = hashOverlayToken(token);
    expect(verifyOverlayToken(token, hash)).toBe(true);
  });

  it("rejects a wrong token", () => {
    const token = generateOverlayToken();
    const hash = hashOverlayToken(token);
    const wrong = generateOverlayToken();
    expect(verifyOverlayToken(wrong, hash)).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = generateOverlayToken();
    const hash = hashOverlayToken(token);
    const tampered = token.slice(0, -1) + (token.slice(-1) === "a" ? "b" : "a");
    expect(verifyOverlayToken(tampered, hash)).toBe(false);
  });
});

describe("buildOverlayUrl", () => {
  it("builds a correct scorebug URL", () => {
    const url = buildOverlayUrl("match-slug", "test-token-123", "scorebug", "https://example.com");
    expect(url).toContain("/cricket/overlays/match-slug/scorebug");
    expect(url).toContain("token=test-token-123");
  });

  it("URL-encodes special characters in token", () => {
    const url = buildOverlayUrl("slug", "a+b=c/d", "minimal", "https://app.com");
    expect(url).not.toContain("a+b=c/d");
    expect(url).toContain("a%2Bb%3Dc%2Fd");
  });
});
