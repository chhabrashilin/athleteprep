import { describe, it, expect } from "vitest";
import { parseCallbackParams } from "@/lib/auth/callback";

function params(init: Record<string, string>): URLSearchParams {
  return new URLSearchParams(init);
}

// ── parseCallbackParams ───────────────────────────────────────────────────────

describe("parseCallbackParams — code flow", () => {
  it("recognises a code param", () => {
    const result = parseCallbackParams(params({ code: "abc123" }));
    expect(result.kind).toBe("code");
    if (result.kind === "code") {
      expect(result.code).toBe("abc123");
    }
  });

  it("defaults next to /dashboard when none provided", () => {
    const result = parseCallbackParams(params({ code: "abc123" }));
    expect(result.next).toBe("/dashboard");
  });

  it("preserves a safe next param", () => {
    const result = parseCallbackParams(params({ code: "x", next: "/teams" }));
    expect(result.next).toBe("/teams");
  });

  it("blocks an external next param — falls back to /dashboard", () => {
    const result = parseCallbackParams(
      params({ code: "x", next: "https://evil.com" })
    );
    expect(result.next).toBe("/dashboard");
  });

  it("blocks a protocol-relative next param", () => {
    const result = parseCallbackParams(
      params({ code: "x", next: "//evil.com" })
    );
    expect(result.next).toBe("/dashboard");
  });
});

describe("parseCallbackParams — token_hash flow", () => {
  it("recognises token_hash + type", () => {
    const result = parseCallbackParams(
      params({ token_hash: "th_abc", type: "email" })
    );
    expect(result.kind).toBe("token_hash");
    if (result.kind === "token_hash") {
      expect(result.tokenHash).toBe("th_abc");
      expect(result.type).toBe("email");
    }
  });

  it("requires both token_hash AND type — only token_hash falls through to confirm", () => {
    const result = parseCallbackParams(params({ token_hash: "th_abc" }));
    expect(result.kind).toBe("confirm");
  });

  it("requires both token_hash AND type — only type falls through to confirm", () => {
    const result = parseCallbackParams(params({ type: "email" }));
    expect(result.kind).toBe("confirm");
  });

  it("accepts redirectTo as alias for next", () => {
    const result = parseCallbackParams(
      params({ token_hash: "th_abc", type: "email", redirectTo: "/dashboard" })
    );
    expect(result.next).toBe("/dashboard");
  });
});

describe("parseCallbackParams — confirm (implicit hash) flow", () => {
  it("falls through to confirm when no code or token_hash present", () => {
    const result = parseCallbackParams(params({}));
    expect(result.kind).toBe("confirm");
  });

  it("still extracts a safe next when falling through", () => {
    const result = parseCallbackParams(params({ next: "/teams/new" }));
    expect(result.kind).toBe("confirm");
    expect(result.next).toBe("/teams/new");
  });

  it("blocks external next even in confirm flow", () => {
    const result = parseCallbackParams(
      params({ next: "https://evil.com/steal" })
    );
    expect(result.kind).toBe("confirm");
    expect(result.next).toBe("/dashboard");
  });
});
