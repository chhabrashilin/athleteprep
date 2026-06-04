/**
 * Pure scheduling functions for cricket round-robin fixture generation.
 * All functions are deterministic and have no side effects.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchPairing {
  homeTeamId: string;
  awayTeamId: string;
}

export interface SchedulingRound {
  roundNumber: number;
  matches: MatchPairing[];
}

export interface ScheduleOptions {
  startDate: string;           // YYYY-MM-DD
  preferredDays: number[];     // 0=Sun … 6=Sat
  matchStartTime: string;      // HH:MM
  matchDurationMinutes: number;
  venueIds?: string[];
  maxMatchesPerDay?: number;
  timezone?: string;
}

export interface ScheduledFixture {
  homeTeamId: string;
  awayTeamId: string;
  roundNumber: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  venueId: string | null;
}

export interface ScheduleConflictResult {
  type: "team_double_booked" | "venue_double_booked" | "same_team" | "invalid_time_range" | "missing_start";
  fixtureIndexA?: number;
  fixtureIndexB?: number;
  description: string;
}

export interface ScheduleSummaryResult {
  totalMatches: number;
  totalRounds: number;
  teamsCount: number;
  venueUsageCounts: Record<string, number>;
  unscheduledCount: number;
  conflictCount: number;
}

// ─── Round-robin pairing algorithm ────────────────────────────────────────────

/**
 * Generates round-robin pairings for a list of teams using the circle method.
 * Supports even and odd team counts (BYE is inserted for odd counts).
 * Returns rounds with home/away assignments; each pair appears exactly once.
 */
export function generateRoundRobinPairings(teamIds: string[]): SchedulingRound[] {
  if (teamIds.length < 2) {
    throw new Error("At least 2 teams are required for round-robin scheduling");
  }

  const ids = [...teamIds];
  const hasBye = ids.length % 2 !== 0;
  if (hasBye) {
    ids.push("BYE");
  }

  const n = ids.length;
  const numRounds = n - 1;
  const matchesPerRound = n / 2;
  const rounds: SchedulingRound[] = [];

  // Circle method: fix first element, rotate the rest
  const circle = ids.slice(1);

  for (let round = 0; round < numRounds; round++) {
    const roundMatches: MatchPairing[] = [];
    const current = [ids[0], ...circle];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        // Alternate home/away by round for balance
        if (round % 2 === 0) {
          roundMatches.push({ homeTeamId: home, awayTeamId: away });
        } else {
          roundMatches.push({ homeTeamId: away, awayTeamId: home });
        }
      }
    }

    rounds.push({ roundNumber: round + 1, matches: roundMatches });

    // Rotate circle (keep first element fixed)
    const last = circle.pop()!;
    circle.unshift(last);
  }

  return rounds;
}

// ─── Date assignment ──────────────────────────────────────────────────────────

/**
 * Assigns scheduled dates/venues to round-robin pairings.
 * Distributes matches across preferred days starting from startDate.
 */
export function assignMatchesToDates(
  pairings: SchedulingRound[],
  options: ScheduleOptions
): ScheduledFixture[] {
  const {
    startDate,
    preferredDays,
    matchStartTime,
    matchDurationMinutes,
    venueIds = [],
    maxMatchesPerDay,
  } = options;

  if (preferredDays.length === 0) {
    throw new Error("At least one preferred day must be provided");
  }

  const fixtures: ScheduledFixture[] = [];
  let currentDate = new Date(`${startDate}T00:00:00`);
  let venueIndex = 0;
  let matchesOnCurrentDay = 0;

  // Advance to first preferred day
  currentDate = advanceToNextPreferredDay(currentDate, preferredDays);

  for (const round of pairings) {
    for (const pairing of round.matches) {
      // Check if we've hit max matches per day
      if (maxMatchesPerDay !== undefined && matchesOnCurrentDay >= maxMatchesPerDay) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = advanceToNextPreferredDay(currentDate, preferredDays);
        matchesOnCurrentDay = 0;
      }

      const [h, m] = matchStartTime.split(":").map(Number);
      const matchStart = new Date(currentDate);
      matchStart.setHours(h, m, 0, 0);

      const matchEnd = new Date(matchStart.getTime() + matchDurationMinutes * 60 * 1000);

      const venueId = venueIds.length > 0 ? venueIds[venueIndex % venueIds.length] : null;
      if (venueIds.length > 0) venueIndex++;

      fixtures.push({
        homeTeamId: pairing.homeTeamId,
        awayTeamId: pairing.awayTeamId,
        roundNumber: round.roundNumber,
        scheduledStart: matchStart.toISOString(),
        scheduledEnd: matchEnd.toISOString(),
        venueId,
      });

      matchesOnCurrentDay++;

      // Move to next day after each match (simplest strategy: one match per slot)
      if (maxMatchesPerDay === undefined || matchesOnCurrentDay >= (maxMatchesPerDay ?? 1)) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate = advanceToNextPreferredDay(currentDate, preferredDays);
        matchesOnCurrentDay = 0;
      }
    }
  }

  return fixtures;
}

function advanceToNextPreferredDay(date: Date, preferredDays: number[]): Date {
  const d = new Date(date);
  for (let i = 0; i < 14; i++) {
    if (preferredDays.includes(d.getDay())) {
      return d;
    }
    d.setDate(d.getDate() + 1);
  }
  return d; // fallback: return as-is after 14 days
}

// ─── Conflict detection ───────────────────────────────────────────────────────

/**
 * Detects scheduling conflicts in a list of fixtures.
 * Checks for team double-booking, venue double-booking, same-team matches,
 * invalid time ranges, and missing start times for published matches.
 */
export function detectScheduleConflicts(
  fixtures: Array<{
    homeTeamId: string;
    awayTeamId: string;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    venueId?: string | null;
    publishStatus?: string;
  }>
): ScheduleConflictResult[] {
  const conflicts: ScheduleConflictResult[] = [];

  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i];

    // Same team match
    if (f.homeTeamId === f.awayTeamId) {
      conflicts.push({
        type: "same_team",
        fixtureIndexA: i,
        description: `Match ${i + 1}: Home and away teams are the same (${f.homeTeamId})`,
      });
    }

    // Invalid time range
    if (f.scheduledStart && f.scheduledEnd) {
      if (new Date(f.scheduledEnd) <= new Date(f.scheduledStart)) {
        conflicts.push({
          type: "invalid_time_range",
          fixtureIndexA: i,
          description: `Match ${i + 1}: Scheduled end is before or equal to scheduled start`,
        });
      }
    }

    // Missing start for published match
    if (f.publishStatus === "published" && !f.scheduledStart) {
      conflicts.push({
        type: "missing_start",
        fixtureIndexA: i,
        description: `Match ${i + 1}: Published match has no scheduled start time`,
      });
    }

    // Check overlaps with later fixtures
    for (let j = i + 1; j < fixtures.length; j++) {
      const g = fixtures[j];
      if (!f.scheduledStart || !f.scheduledEnd || !g.scheduledStart || !g.scheduledEnd) {
        continue;
      }

      const fStart = new Date(f.scheduledStart).getTime();
      const fEnd = new Date(f.scheduledEnd).getTime();
      const gStart = new Date(g.scheduledStart).getTime();
      const gEnd = new Date(g.scheduledEnd).getTime();

      const overlaps = fStart < gEnd && gStart < fEnd;
      if (!overlaps) continue;

      // Team double-booked
      const sharedTeams = [
        f.homeTeamId === g.homeTeamId && f.homeTeamId,
        f.homeTeamId === g.awayTeamId && f.homeTeamId,
        f.awayTeamId === g.homeTeamId && f.awayTeamId,
        f.awayTeamId === g.awayTeamId && f.awayTeamId,
      ].filter(Boolean);

      if (sharedTeams.length > 0) {
        conflicts.push({
          type: "team_double_booked",
          fixtureIndexA: i,
          fixtureIndexB: j,
          description: `Matches ${i + 1} and ${j + 1}: Team(s) ${sharedTeams.join(", ")} are double-booked at overlapping times`,
        });
      }

      // Venue double-booked
      if (f.venueId && g.venueId && f.venueId === g.venueId) {
        conflicts.push({
          type: "venue_double_booked",
          fixtureIndexA: i,
          fixtureIndexB: j,
          description: `Matches ${i + 1} and ${j + 1}: Venue ${f.venueId} is double-booked at overlapping times`,
        });
      }
    }
  }

  return conflicts;
}

// ─── Schedule summary ─────────────────────────────────────────────────────────

export function summarizeSchedule(fixtures: ScheduledFixture[]): ScheduleSummaryResult {
  const teamSet = new Set<string>();
  const venueUsageCounts: Record<string, number> = {};
  let unscheduledCount = 0;
  const roundSet = new Set<number>();

  for (const f of fixtures) {
    teamSet.add(f.homeTeamId);
    teamSet.add(f.awayTeamId);
    roundSet.add(f.roundNumber);
    if (!f.scheduledStart) unscheduledCount++;
    if (f.venueId) {
      venueUsageCounts[f.venueId] = (venueUsageCounts[f.venueId] ?? 0) + 1;
    }
  }

  const conflicts = detectScheduleConflicts(fixtures);

  return {
    totalMatches: fixtures.length,
    totalRounds: roundSet.size,
    teamsCount: teamSet.size,
    venueUsageCounts,
    unscheduledCount,
    conflictCount: conflicts.length,
  };
}
