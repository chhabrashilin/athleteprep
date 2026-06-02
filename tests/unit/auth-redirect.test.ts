import { describe, it, expect } from "vitest";
import { isSafeRedirect, safeRedirect } from "@/lib/auth/redirect";

describe("isSafeRedirect", () => {
  it("returns true for a plain internal path", () => {
    expect(isSafeRedirect("/dashboard")).toBe(true);
  });

  it("returns true for a nested internal path", () => {
    expect(isSafeRedirect("/teams/abc-123/games")).toBe(true);
  });

  it("returns true for root path", () => {
    expect(isSafeRedirect("/")).toBe(true);
  });

  it("returns false for protocol-relative external URL", () => {
    expect(isSafeRedirect("//evil.com")).toBe(false);
  });

  it("returns false for https external URL", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
  });

  it("returns false for http external URL", () => {
    expect(isSafeRedirect("http://evil.com/steal")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSafeRedirect("")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isSafeRedirect(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSafeRedirect(null)).toBe(false);
  });

  it("returns false for a bare domain without slash", () => {
    expect(isSafeRedirect("evil.com")).toBe(false);
  });
});

describe("safeRedirect", () => {
  it("returns the url when safe", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard");
  });

  it("returns /dashboard fallback for external URL", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard");
  });

  it("returns /dashboard fallback for protocol-relative URL", () => {
    expect(safeRedirect("//evil.com")).toBe("/dashboard");
  });

  it("returns /dashboard fallback for undefined", () => {
    expect(safeRedirect(undefined)).toBe("/dashboard");
  });

  it("returns /dashboard fallback for null", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
  });

  it("accepts a custom fallback path", () => {
    expect(safeRedirect("https://evil.com", "/")).toBe("/");
  });

  it("returns the custom fallback when safe url is provided and valid", () => {
    expect(safeRedirect("/teams", "/")).toBe("/teams");
  });
});
