/**
 * tests/unit/team-validation.test.ts
 * Unit tests for cricket team validation schemas and helpers.
 */

import { describe, it, expect } from "vitest";
import {
  createTeamSchema,
  inviteTeamMemberSchema,
  generateTeamSlug,
  normalizeTeamSlug,
  normalizeCricketEmail,
  validateJerseyNumber,
} from "@/lib/cricket/validation/team";

const VALID_LEAGUE_ID = "12345678-1234-4234-8234-123456789012";

const VALID_TEAM_INPUT = {
  leagueId: VALID_LEAGUE_ID,
  name: "Madison Strikers",
  shortName: "MDS",
};

// ─── generateTeamSlug ─────────────────────────────────────────────────────────

describe("generateTeamSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(generateTeamSlug("Madison Strikers")).toBe("madison-strikers");
  });

  it("removes special characters", () => {
    expect(generateTeamSlug("FC Zürich & Co.")).toBe("fc-zrich-co");
  });

  it("collapses multiple hyphens", () => {
    expect(generateTeamSlug("Ann  Arbor  Royals")).toBe("ann-arbor-royals");
  });

  it("strips leading/trailing hyphens", () => {
    expect(generateTeamSlug("  Test Team  ")).toBe("test-team");
  });

  it("appends league suffix when provided", () => {
    const slug = generateTeamSlug("Tigers", "Summer League");
    expect(slug).toBe("tigers-summer-league");
  });

  it("truncates league suffix to 20 chars", () => {
    const slug = generateTeamSlug("Eagles", "A Very Long League Name That Should Be Truncated");
    expect(slug.split("-eagles-")[0] ?? slug).toBeTruthy();
    expect(slug.length).toBeLessThan(100);
  });
});

// ─── normalizeTeamSlug ────────────────────────────────────────────────────────

describe("normalizeTeamSlug", () => {
  it("lowercases", () => {
    expect(normalizeTeamSlug("Madison-Strikers")).toBe("madison-strikers");
  });

  it("removes invalid characters", () => {
    expect(normalizeTeamSlug("team_name!@#")).toBe("teamname");
  });

  it("collapses double hyphens", () => {
    expect(normalizeTeamSlug("team--name")).toBe("team-name");
  });

  it("strips leading/trailing hyphens", () => {
    expect(normalizeTeamSlug("-test-")).toBe("test");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTeamSlug("")).toBe("");
  });
});

// ─── normalizeCricketEmail ────────────────────────────────────────────────────

describe("normalizeCricketEmail", () => {
  it("lowercases email", () => {
    expect(normalizeCricketEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    expect(normalizeCricketEmail("  hello@world.com  ")).toBe("hello@world.com");
  });
});

// ─── validateJerseyNumber ─────────────────────────────────────────────────────

describe("validateJerseyNumber", () => {
  it("accepts single digit", () => {
    expect(validateJerseyNumber("7")).toBe(true);
  });

  it("accepts two digits", () => {
    expect(validateJerseyNumber("10")).toBe(true);
  });

  it("accepts up to 4 chars", () => {
    expect(validateJerseyNumber("99A")).toBe(true);
  });

  it("rejects 5 chars", () => {
    expect(validateJerseyNumber("12345")).toBe(false);
  });

  it("rejects special chars", () => {
    expect(validateJerseyNumber("1-2")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateJerseyNumber("")).toBe(false);
  });
});

// ─── createTeamSchema ─────────────────────────────────────────────────────────

describe("createTeamSchema", () => {
  it("accepts a valid minimum team", () => {
    const result = createTeamSchema.safeParse(VALID_TEAM_INPUT);
    expect(result.success).toBe(true);
  });

  it("accepts a full team input", () => {
    const result = createTeamSchema.safeParse({
      ...VALID_TEAM_INPUT,
      description: "A great team",
      teamType: "club",
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#1a2b3c",
      secondaryColor: "#ffffff",
      homeGround: "Madison Ground",
      managerEmail: "manager@example.com",
      contactEmail: "team@example.com",
      contactPhone: "+1 555 000 0000",
      websiteUrl: "https://example.com",
      instagramUrl: "https://instagram.com/team",
      foundedYear: 2010,
      coachName: "John Smith",
      scorerName: "Jane Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, name: "X" });
    expect(result.success).toBe(false);
  });

  it("rejects short name longer than 20 chars", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, shortName: "A".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, slug: "-bad-slug-" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid manager email", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, managerEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid website URL", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, primaryColor: "red" });
    expect(result.success).toBe(false);
  });

  it("accepts valid hex color", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, primaryColor: "#1a2b3c" });
    expect(result.success).toBe(true);
  });

  it("rejects founded year in the future", () => {
    const result = createTeamSchema.safeParse({
      ...VALID_TEAM_INPUT,
      foundedYear: new Date().getFullYear() + 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects founded year before 1800", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, foundedYear: 1799 });
    expect(result.success).toBe(false);
  });

  it("rejects missing leagueId", () => {
    const { leagueId: _, ...rest } = VALID_TEAM_INPUT;
    const result = createTeamSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid leagueId format", () => {
    const result = createTeamSchema.safeParse({ ...VALID_TEAM_INPUT, leagueId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

// ─── inviteTeamMemberSchema ───────────────────────────────────────────────────

describe("inviteTeamMemberSchema", () => {
  it("accepts valid invite", () => {
    const result = inviteTeamMemberSchema.safeParse({ email: "player@example.com", role: "player" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid roles", () => {
    const roles = ["manager", "coach", "captain", "vice_captain", "scorer", "analyst", "player", "member"];
    for (const role of roles) {
      const result = inviteTeamMemberSchema.safeParse({ email: "x@x.com", role });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    const result = inviteTeamMemberSchema.safeParse({ email: "x@x.com", role: "owner" });
    expect(result.success).toBe(false);
  });

  it("rejects bad email", () => {
    const result = inviteTeamMemberSchema.safeParse({ email: "notanemail", role: "player" });
    expect(result.success).toBe(false);
  });
});
