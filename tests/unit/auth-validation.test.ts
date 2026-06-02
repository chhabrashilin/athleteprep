import { describe, it, expect } from "vitest";

// Mirrors the validation logic in SignupForm so it can be tested in isolation.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function validateSignupName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Please enter your name.";
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 100) return "Name must be 100 characters or fewer.";
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

// ── Email ────────────────────────────────────────────────────────────────────

describe("email validation", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("coach@team.com")).toBe(true);
    expect(isValidEmail("user+tag@example.org")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });

  it("rejects emails without @", () => {
    expect(isValidEmail("notanemail")).toBe(false);
  });

  it("rejects emails without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects emails without local part", () => {
    expect(isValidEmail("@domain.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects strings with spaces", () => {
    expect(isValidEmail("user name@domain.com")).toBe(false);
  });
});

// ── Name ─────────────────────────────────────────────────────────────────────

describe("signup name validation", () => {
  it("accepts a name within bounds", () => {
    expect(validateSignupName("Jo")).toBeNull();
    expect(validateSignupName("Coach Johnson")).toBeNull();
  });

  it("rejects empty name", () => {
    expect(validateSignupName("")).not.toBeNull();
    expect(validateSignupName("   ")).not.toBeNull();
  });

  it("rejects single character name", () => {
    expect(validateSignupName("J")).not.toBeNull();
  });

  it("rejects name longer than 100 chars", () => {
    expect(validateSignupName("A".repeat(101))).not.toBeNull();
  });

  it("accepts name of exactly 2 chars", () => {
    expect(validateSignupName("Jo")).toBeNull();
  });

  it("accepts name of exactly 100 chars", () => {
    expect(validateSignupName("A".repeat(100))).toBeNull();
  });
});

// ── Password ─────────────────────────────────────────────────────────────────

describe("password validation", () => {
  it("accepts password of 8+ chars", () => {
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("a-strong-password!")).toBeNull();
  });

  it("rejects password shorter than 8 chars", () => {
    expect(validatePassword("short")).not.toBeNull();
    expect(validatePassword("1234567")).not.toBeNull();
  });

  it("rejects empty password", () => {
    expect(validatePassword("")).not.toBeNull();
  });
});

// ── Password match ───────────────────────────────────────────────────────────

describe("password match validation", () => {
  it("accepts matching passwords", () => {
    expect(validatePasswordMatch("password123", "password123")).toBeNull();
  });

  it("rejects mismatched passwords", () => {
    expect(validatePasswordMatch("password123", "different")).not.toBeNull();
  });

  it("rejects when confirm is empty", () => {
    expect(validatePasswordMatch("password123", "")).not.toBeNull();
  });

  it("is case-sensitive", () => {
    expect(validatePasswordMatch("Password", "password")).not.toBeNull();
  });
});
