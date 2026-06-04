import { describe, it, expect } from "vitest";
import {
  generateRoundRobinPairings,
  assignMatchesToDates,
  detectScheduleConflicts,
  summarizeSchedule,
} from "@/lib/cricket/scheduling/round-robin";

describe("generateRoundRobinPairings", () => {
  it("throws for fewer than 2 teams", () => {
    expect(() => generateRoundRobinPairings(["A"])).toThrow();
    expect(() => generateRoundRobinPairings([])).toThrow();
  });

  it("2 teams → 1 match, 1 round", () => {
    const rounds = generateRoundRobinPairings(["A", "B"]);
    expect(rounds).toHaveLength(1);
    expect(rounds[0].matches).toHaveLength(1);
    const m = rounds[0].matches[0];
    expect([m.homeTeamId, m.awayTeamId].sort()).toEqual(["A", "B"]);
  });

  it("4 teams → 6 matches across 3 rounds", () => {
    const teams = ["A", "B", "C", "D"];
    const rounds = generateRoundRobinPairings(teams);
    expect(rounds).toHaveLength(3);
    const allMatches = rounds.flatMap((r) => r.matches);
    expect(allMatches).toHaveLength(6);
  });

  it("produces no self-matches", () => {
    const teams = ["A", "B", "C", "D", "E"];
    const rounds = generateRoundRobinPairings(teams);
    const selfMatches = rounds.flatMap((r) => r.matches).filter((m) => m.homeTeamId === m.awayTeamId);
    expect(selfMatches).toHaveLength(0);
  });

  it("produces no duplicate pairings for 4 teams", () => {
    const teams = ["A", "B", "C", "D"];
    const rounds = generateRoundRobinPairings(teams);
    const allMatches = rounds.flatMap((r) => r.matches);
    const keys = allMatches.map((m) => [m.homeTeamId, m.awayTeamId].sort().join("-"));
    const unique = new Set(keys);
    expect(unique.size).toBe(allMatches.length);
  });

  it("3 teams (odd) → 3 matches with BYE rounds handled", () => {
    const teams = ["A", "B", "C"];
    const rounds = generateRoundRobinPairings(teams);
    const allMatches = rounds.flatMap((r) => r.matches);
    // 3 teams → 3 matches (nC2 = 3), BYE rounds produce 0-match rounds or smaller rounds
    expect(allMatches).toHaveLength(3);
    // No self-matches
    expect(allMatches.some((m) => m.homeTeamId === m.awayTeamId)).toBe(false);
    // No duplicate pairings
    const keys = allMatches.map((m) => [m.homeTeamId, m.awayTeamId].sort().join("-"));
    expect(new Set(keys).size).toBe(3);
  });

  it("5 teams (odd) → 10 matches", () => {
    const teams = ["A", "B", "C", "D", "E"];
    const rounds = generateRoundRobinPairings(teams);
    const allMatches = rounds.flatMap((r) => r.matches);
    // 5 teams → 5*4/2 = 10 matches
    expect(allMatches).toHaveLength(10);
    // No BYE in match list
    expect(allMatches.some((m) => m.homeTeamId === "BYE" || m.awayTeamId === "BYE")).toBe(false);
  });

  it("round numbers are sequential starting at 1", () => {
    const rounds = generateRoundRobinPairings(["A", "B", "C", "D"]);
    rounds.forEach((r, i) => {
      expect(r.roundNumber).toBe(i + 1);
    });
  });
});

describe("assignMatchesToDates", () => {
  const baseOptions = {
    startDate: "2026-06-07",
    preferredDays: [6], // Saturday
    matchStartTime: "10:00",
    matchDurationMinutes: 240,
  };

  it("assigns a date to each fixture", () => {
    const pairings = generateRoundRobinPairings(["A", "B", "C", "D"]);
    const fixtures = assignMatchesToDates(pairings, baseOptions);
    expect(fixtures.length).toBe(6);
    expect(fixtures.every((f) => f.scheduledStart !== null)).toBe(true);
  });

  it("respects preferred days", () => {
    const pairings = generateRoundRobinPairings(["A", "B"]);
    const fixtures = assignMatchesToDates(pairings, {
      ...baseOptions,
      preferredDays: [6], // Saturday = day 6
    });
    expect(fixtures).toHaveLength(1);
    const day = new Date(fixtures[0].scheduledStart!).getDay();
    expect(day).toBe(6);
  });

  it("rotates venues across fixtures", () => {
    const pairings = generateRoundRobinPairings(["A", "B", "C", "D"]);
    const fixtures = assignMatchesToDates(pairings, {
      ...baseOptions,
      venueIds: ["venue-1", "venue-2"],
      maxMatchesPerDay: 10,
    });
    const venueIds = fixtures.map((f) => f.venueId);
    expect(venueIds.some((v) => v === "venue-1")).toBe(true);
    expect(venueIds.some((v) => v === "venue-2")).toBe(true);
  });

  it("throws when no preferred days given", () => {
    const pairings = generateRoundRobinPairings(["A", "B"]);
    expect(() => assignMatchesToDates(pairings, { ...baseOptions, preferredDays: [] })).toThrow();
  });

  it("scheduledEnd is after scheduledStart", () => {
    const pairings = generateRoundRobinPairings(["A", "B"]);
    const fixtures = assignMatchesToDates(pairings, baseOptions);
    for (const f of fixtures) {
      expect(new Date(f.scheduledEnd!).getTime()).toBeGreaterThan(new Date(f.scheduledStart!).getTime());
    }
  });
});

describe("detectScheduleConflicts", () => {
  it("returns empty for no conflicts", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "B",
        scheduledStart: "2026-06-07T10:00:00.000Z",
        scheduledEnd: "2026-06-07T14:00:00.000Z",
        venueId: "v1",
      },
      {
        homeTeamId: "C",
        awayTeamId: "D",
        scheduledStart: "2026-06-07T15:00:00.000Z",
        scheduledEnd: "2026-06-07T19:00:00.000Z",
        venueId: "v1",
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts).toHaveLength(0);
  });

  it("detects team double-booking", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "B",
        scheduledStart: "2026-06-07T10:00:00.000Z",
        scheduledEnd: "2026-06-07T14:00:00.000Z",
        venueId: "v1",
      },
      {
        homeTeamId: "A",
        awayTeamId: "C",
        scheduledStart: "2026-06-07T11:00:00.000Z",
        scheduledEnd: "2026-06-07T15:00:00.000Z",
        venueId: "v2",
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts.some((c) => c.type === "team_double_booked")).toBe(true);
  });

  it("detects venue double-booking", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "B",
        scheduledStart: "2026-06-07T10:00:00.000Z",
        scheduledEnd: "2026-06-07T14:00:00.000Z",
        venueId: "v1",
      },
      {
        homeTeamId: "C",
        awayTeamId: "D",
        scheduledStart: "2026-06-07T11:00:00.000Z",
        scheduledEnd: "2026-06-07T15:00:00.000Z",
        venueId: "v1",
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts.some((c) => c.type === "venue_double_booked")).toBe(true);
  });

  it("detects same-team match", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "A",
        scheduledStart: "2026-06-07T10:00:00.000Z",
        scheduledEnd: "2026-06-07T14:00:00.000Z",
        venueId: null,
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts.some((c) => c.type === "same_team")).toBe(true);
  });

  it("detects invalid time range (end before start)", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "B",
        scheduledStart: "2026-06-07T14:00:00.000Z",
        scheduledEnd: "2026-06-07T10:00:00.000Z",
        venueId: null,
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts.some((c) => c.type === "invalid_time_range")).toBe(true);
  });

  it("detects missing start for published match", () => {
    const fixtures = [
      {
        homeTeamId: "A",
        awayTeamId: "B",
        scheduledStart: null,
        scheduledEnd: null,
        venueId: null,
        publishStatus: "published",
      },
    ];
    const conflicts = detectScheduleConflicts(fixtures);
    expect(conflicts.some((c) => c.type === "missing_start")).toBe(true);
  });
});

describe("summarizeSchedule", () => {
  it("returns correct summary for 6-match schedule", () => {
    const pairings = generateRoundRobinPairings(["A", "B", "C", "D"]);
    const fixtures = assignMatchesToDates(pairings, {
      startDate: "2026-06-07",
      preferredDays: [6],
      matchStartTime: "10:00",
      matchDurationMinutes: 240,
      venueIds: ["v1"],
    });

    const summary = summarizeSchedule(fixtures);
    expect(summary.totalMatches).toBe(6);
    expect(summary.totalRounds).toBe(3);
    expect(summary.teamsCount).toBe(4);
    expect(summary.unscheduledCount).toBe(0);
    expect(summary.conflictCount).toBe(0);
    expect(summary.venueUsageCounts["v1"]).toBe(6);
  });

  it("counts unscheduled fixtures", () => {
    const fixtures = [
      { homeTeamId: "A", awayTeamId: "B", roundNumber: 1, scheduledStart: null, scheduledEnd: null, venueId: null },
      { homeTeamId: "C", awayTeamId: "D", roundNumber: 1, scheduledStart: "2026-06-07T10:00:00.000Z", scheduledEnd: "2026-06-07T14:00:00.000Z", venueId: null },
    ];
    const summary = summarizeSchedule(fixtures);
    expect(summary.unscheduledCount).toBe(1);
    expect(summary.totalMatches).toBe(2);
  });
});
