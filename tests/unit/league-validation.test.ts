import { describe, it, expect } from "vitest";
import {
  createLeagueSchema,
  generateLeagueSlug,
  normalizeLeagueSlug,
  validateLeagueDateRange,
} from "@/lib/cricket/validation/league";

// ─── generateLeagueSlug ───────────────────────────────────────────────────────

describe("generateLeagueSlug", () => {
  it("lowercases input", () => {
    expect(generateLeagueSlug("Chicago Cricket")).toBe("chicago-cricket");
  });

  it("converts spaces to hyphens", () => {
    expect(generateLeagueSlug("Greater Bay Area League")).toBe(
      "greater-bay-area-league"
    );
  });

  it("collapses multiple spaces", () => {
    expect(generateLeagueSlug("My  Double   Space")).toBe("my-double-space");
  });

  it("removes special characters and collapses hyphens", () => {
    // & and ! and # are removed; resulting double-space becomes double-hyphen which is then collapsed
    expect(generateLeagueSlug("Best & Brightest! League #1")).toBe(
      "best-brightest-league-1"
    );
  });

  it("strips leading and trailing hyphens", () => {
    const slug = generateLeagueSlug("   Trimmed  ");
    expect(slug.startsWith("-")).toBe(false);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("handles numbers in name", () => {
    expect(generateLeagueSlug("T20 2025")).toBe("t20-2025");
  });

  it("returns empty string for empty input", () => {
    expect(generateLeagueSlug("")).toBe("");
  });
});

// ─── normalizeLeagueSlug ──────────────────────────────────────────────────────

describe("normalizeLeagueSlug", () => {
  it("lowercases input", () => {
    expect(normalizeLeagueSlug("MyLeague")).toBe("myleague");
  });

  it("removes non-slug characters", () => {
    expect(normalizeLeagueSlug("hello world!")).toBe("helloworld");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeLeagueSlug("hello--world")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(normalizeLeagueSlug("-hello-")).toBe("hello");
  });

  it("keeps valid characters untouched", () => {
    expect(normalizeLeagueSlug("valid-slug-123")).toBe("valid-slug-123");
  });
});

// ─── validateLeagueDateRange ──────────────────────────────────────────────────

describe("validateLeagueDateRange", () => {
  it("returns valid when both dates are undefined", () => {
    expect(validateLeagueDateRange(undefined, undefined).valid).toBe(true);
  });

  it("returns valid when only start date is provided", () => {
    expect(validateLeagueDateRange("2025-01-01", undefined).valid).toBe(true);
  });

  it("returns valid when end is after start", () => {
    expect(validateLeagueDateRange("2025-01-01", "2025-12-31").valid).toBe(true);
  });

  it("returns valid when start equals end", () => {
    expect(validateLeagueDateRange("2025-06-01", "2025-06-01").valid).toBe(true);
  });

  it("returns invalid when end is before start", () => {
    const result = validateLeagueDateRange("2025-12-31", "2025-01-01");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("End date");
  });

  it("returns invalid for bad date format", () => {
    const result = validateLeagueDateRange("not-a-date", "2025-12-31");
    expect(result.valid).toBe(false);
  });
});

// ─── createLeagueSchema ───────────────────────────────────────────────────────

describe("createLeagueSchema — acceptance", () => {
  const validInput = {
    name: "Chicago Cricket League",
    slug: "chicago-cricket-league",
    seasonName: "Summer 2025",
    format: "round_robin",
    oversPerInnings: 20,
    timezone: "America/Chicago",
    visibility: "private",
  };

  it("accepts a minimal valid input", () => {
    expect(createLeagueSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = createLeagueSchema.safeParse({
      ...validInput,
      description: "A friendly summer league.",
      country: "USA",
      maxTeams: 12,
      contactEmail: "league@example.com",
      websiteUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("createLeagueSchema — rejections", () => {
  const base = {
    name: "Chicago Cricket League",
    slug: "chicago-cricket-league",
    seasonName: "Summer 2025",
    format: "round_robin",
    oversPerInnings: 20,
    timezone: "America/Chicago",
    visibility: "private",
  };

  it("rejects name shorter than 3 chars", () => {
    const result = createLeagueSchema.safeParse({ ...base, name: "AB" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 chars", () => {
    const result = createLeagueSchema.safeParse({ ...base, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects slug with invalid characters", () => {
    const result = createLeagueSchema.safeParse({ ...base, slug: "bad slug!" });
    expect(result.success).toBe(false);
  });

  it("rejects slug starting with hyphen", () => {
    const result = createLeagueSchema.safeParse({ ...base, slug: "-bad-start" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format value", () => {
    const result = createLeagueSchema.safeParse({ ...base, format: "swiss" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid visibility value", () => {
    const result = createLeagueSchema.safeParse({ ...base, visibility: "secret" });
    expect(result.success).toBe(false);
  });

  it("rejects overs below 1", () => {
    const result = createLeagueSchema.safeParse({ ...base, oversPerInnings: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects overs above 100", () => {
    const result = createLeagueSchema.safeParse({ ...base, oversPerInnings: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects maxTeams below 2", () => {
    const result = createLeagueSchema.safeParse({ ...base, maxTeams: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects maxTeams above 128", () => {
    const result = createLeagueSchema.safeParse({ ...base, maxTeams: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid contact email", () => {
    const result = createLeagueSchema.safeParse({ ...base, contactEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid website URL", () => {
    const result = createLeagueSchema.safeParse({ ...base, websiteUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for optional contact email", () => {
    const result = createLeagueSchema.safeParse({ ...base, contactEmail: "" });
    expect(result.success).toBe(true);
  });

  it("rejects end date before start date", () => {
    const result = createLeagueSchema.safeParse({
      ...base,
      startDate: "2025-12-31",
      endDate: "2025-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((e) => e.path.join("."));
      expect(paths).toContain("endDate");
    }
  });

  it("accepts end date on same day as start date", () => {
    const result = createLeagueSchema.safeParse({
      ...base,
      startDate: "2025-06-01",
      endDate: "2025-06-01",
    });
    expect(result.success).toBe(true);
  });
});
