import { z } from "zod";

const ALLOWED_LEADERBOARD_TYPES = [
  "batting_runs",
  "batting_average",
  "batting_strike_rate",
  "highest_score",
  "bowling_wickets",
  "bowling_average",
  "economy_rate",
  "bowling_strike_rate",
  "fielding_catches",
  "all_rounder_index",
  "team_nrr",
  "team_points",
] as const;

export const standingsRebuildSchema = z.object({
  leagueId: z.string().uuid("league_id must be a valid UUID"),
  includeUnpublishedMatches: z.boolean().default(false),
  includeIncompletescorecards: z.boolean().default(false),
  nrrUseFullQuotaWhenAllOut: z.boolean().default(true),
  snapshot: z.boolean().default(true),
});

export type StandingsRebuildInput = z.infer<typeof standingsRebuildSchema>;

export const leaderboardFilterSchema = z.object({
  leagueId: z.string().uuid("league_id must be a valid UUID"),
  teamId: z.string().uuid().optional(),
  leaderboardType: z.enum(ALLOWED_LEADERBOARD_TYPES),
  minMatches: z.number().int().min(0).optional(),
  minInnings: z.number().int().min(0).optional(),
  minBalls: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export type LeaderboardFilterInput = z.infer<typeof leaderboardFilterSchema>;

export const standingsAdjustmentSchema = z.object({
  teamId: z.string().uuid("team_id must be a valid UUID"),
  pointsAdjustment: z.number().int(),
  reason: z.string().min(1).max(1000),
});

export type StandingsAdjustmentInput = z.infer<typeof standingsAdjustmentSchema>;
