import { describe, it, expect } from "vitest";
import {
  createMatchSchema,
  generateMatchSlug,
  validateMatchTimeRange,
  validateTeamsAreDifferent,
  estimateMatchEndTime,
} from "@/lib/cricket/validation/match";
import { generateScheduleSchema } from "@/lib/cricket/validation/schedule";

// RFC 4122 v4 UUIDs: version digit=4 at position 14, variant digit in {8,9,a,b} at position 19
const LEAGUE_ID  = "12345678-1234-4000-8abc-123456789abc";
const HOME_ID    = "23456789-2345-4000-9abc-234567890abc";
const AWAY_ID    = "34567890-3456-4000-aabc-345678901abc";

describe("createMatchSchema", () => {
  const validMatch = {
    leagueId: LEAGUE_ID,
    homeTeamId: HOME_ID,
    awayTeamId: AWAY_ID,
    oversPerInnings: 20,
  };

  it("accepts a valid match", () => {
    const result = createMatchSchema.safeParse(validMatch);
    expect(result.success).toBe(true);
  });

  it("rejects same home and away team", () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      awayTeamId: HOME_ID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("different");
    }
  });

  it("rejects overs below 1", () => {
    const result = createMatchSchema.safeParse({ ...validMatch, oversPerInnings: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects overs above 100", () => {
    const result = createMatchSchema.safeParse({ ...validMatch, oversPerInnings: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time range (end before start)", () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      scheduledStart: "2026-06-07T14:00:00.000Z",
      scheduledEnd: "2026-06-07T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("after");
    }
  });

  it("accepts valid time range (end after start)", () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      scheduledStart: "2026-06-07T10:00:00.000Z",
      scheduledEnd: "2026-06-07T14:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative match number", () => {
    const result = createMatchSchema.safeParse({ ...validMatch, matchNumber: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields as null", () => {
    const result = createMatchSchema.safeParse({
      ...validMatch,
      venueId: null,
      scheduledStart: null,
      scheduledEnd: null,
      matchNumber: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("generateScheduleSchema", () => {
  const validSchedule = {
    leagueId: LEAGUE_ID,
    teamIds: [HOME_ID, AWAY_ID],
    startDate: "2026-06-07",
    preferredDays: [0, 6],
    matchStartTime: "10:00",
    matchDurationMinutes: 240,
  };

  it("accepts a valid schedule config", () => {
    const result = generateScheduleSchema.safeParse(validSchedule);
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 2 teams", () => {
    const result = generateScheduleSchema.safeParse({
      ...validSchedule,
      teamIds: [HOME_ID],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration below 30", () => {
    const result = generateScheduleSchema.safeParse({
      ...validSchedule,
      matchDurationMinutes: 20,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration above 720", () => {
    const result = generateScheduleSchema.safeParse({
      ...validSchedule,
      matchDurationMinutes: 800,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid startDate format", () => {
    const result = generateScheduleSchema.safeParse({
      ...validSchedule,
      startDate: "06/07/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("match validation helpers", () => {
  it("validateMatchTimeRange returns true when end > start", () => {
    expect(
      validateMatchTimeRange("2026-06-07T10:00:00Z", "2026-06-07T14:00:00Z")
    ).toBe(true);
  });

  it("validateMatchTimeRange returns false when end <= start", () => {
    expect(
      validateMatchTimeRange("2026-06-07T14:00:00Z", "2026-06-07T10:00:00Z")
    ).toBe(false);
    expect(
      validateMatchTimeRange("2026-06-07T10:00:00Z", "2026-06-07T10:00:00Z")
    ).toBe(false);
  });

  it("validateTeamsAreDifferent returns true for different IDs", () => {
    expect(validateTeamsAreDifferent("team-a", "team-b")).toBe(true);
  });

  it("validateTeamsAreDifferent returns false for same ID", () => {
    expect(validateTeamsAreDifferent("team-a", "team-a")).toBe(false);
  });

  it("estimateMatchEndTime adds duration correctly", () => {
    const start = "2026-06-07T10:00:00.000Z";
    const end = estimateMatchEndTime(start, 240);
    const expected = new Date("2026-06-07T14:00:00.000Z").toISOString();
    expect(end).toBe(expected);
  });

  it("generateMatchSlug creates a readable slug", () => {
    const slug = generateMatchSlug("madison-strikers", "ann-arbor-royals", "2026-06-07");
    expect(slug).toContain("madison");
    expect(slug).toContain("ann");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});
