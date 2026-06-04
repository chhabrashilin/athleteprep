import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

export const DISMISSAL_TYPES = [
  "not_out",
  "bowled",
  "caught",
  "caught_behind",
  "lbw",
  "run_out",
  "stumped",
  "hit_wicket",
  "retired_hurt",
  "retired_out",
  "obstructing_field",
  "hit_ball_twice",
  "timed_out",
  "handled_ball",
  "did_not_bat",
  "absent_hurt",
  "unknown",
] as const;

export const INNINGS_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "declared",
  "forfeited",
] as const;

export const RESULT_TYPES = [
  "home_win",
  "away_win",
  "tie",
  "no_result",
  "abandoned",
  "cancelled",
  "forfeited",
  "draw",
  "unknown",
] as const;

export const TOSS_DECISIONS = ["bat", "bowl", "field"] as const;

export const SCORECARD_STATUSES = [
  "not_started",
  "setup",
  "in_progress",
  "completed",
  "locked",
  "disputed",
] as const;

// ─── Match setup schema ───────────────────────────────────────────────────────

export const matchSetupSchema = z.object({
  matchId: z.string().uuid("Invalid match ID"),
  tossWinnerTeamId: z.string().uuid().optional().nullable(),
  tossDecision: z.enum(TOSS_DECISIONS).optional().nullable(),
  scorerUserId: z.string().uuid().optional().nullable(),
});

export const saveSquadsSchema = z
  .object({
    matchId: z.string().uuid(),
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
    homeSquad: z.array(
      z.object({
        playerId: z.string().uuid(),
        isPlayingXi: z.boolean().default(true),
        battingPosition: z.number().int().min(1).max(15).optional().nullable(),
        isCaptain: z.boolean().default(false),
        isWicketkeeper: z.boolean().default(false),
        isSubstitute: z.boolean().default(false),
      })
    ).max(15, "Maximum 15 players in a squad"),
    awaySquad: z.array(
      z.object({
        playerId: z.string().uuid(),
        isPlayingXi: z.boolean().default(true),
        battingPosition: z.number().int().min(1).max(15).optional().nullable(),
        isCaptain: z.boolean().default(false),
        isWicketkeeper: z.boolean().default(false),
        isSubstitute: z.boolean().default(false),
      })
    ).max(15, "Maximum 15 players in a squad"),
  })
  .superRefine((data, ctx) => {
    // No duplicate players in home squad
    const homeIds = data.homeSquad.map((p) => p.playerId);
    if (new Set(homeIds).size !== homeIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Home squad contains duplicate players",
        path: ["homeSquad"],
      });
    }
    // No duplicate players in away squad
    const awayIds = data.awaySquad.map((p) => p.playerId);
    if (new Set(awayIds).size !== awayIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Away squad contains duplicate players",
        path: ["awaySquad"],
      });
    }
  });

export const tossSchema = z
  .object({
    tossWinnerTeamId: z.string().uuid("Invalid toss winner team ID"),
    tossDecision: z.enum(TOSS_DECISIONS),
    homeTeamId: z.string().uuid(),
    awayTeamId: z.string().uuid(),
  })
  .superRefine((data, ctx) => {
    if (
      data.tossWinnerTeamId !== data.homeTeamId &&
      data.tossWinnerTeamId !== data.awayTeamId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Toss winner must be home or away team",
        path: ["tossWinnerTeamId"],
      });
    }
  });

// ─── Innings schema ───────────────────────────────────────────────────────────

export const inningsSchema = z
  .object({
    matchId: z.string().uuid(),
    inningsNumber: z.number().int().positive(),
    battingTeamId: z.string().uuid(),
    bowlingTeamId: z.string().uuid(),
    totalRuns: z.number().int().min(0, "Total runs cannot be negative"),
    wicketsLost: z.number().int().min(0).max(10, "Wickets cannot exceed 10"),
    ballsBowled: z.number().int().min(0),
    byes: z.number().int().min(0).default(0),
    legByes: z.number().int().min(0).default(0),
    wides: z.number().int().min(0).default(0),
    noBalls: z.number().int().min(0).default(0),
    penaltyRuns: z.number().int().min(0).default(0),
    targetRuns: z.number().int().min(0).optional().nullable(),
    inningsStatus: z.enum(INNINGS_STATUSES).default("not_started"),
    declared: z.boolean().default(false),
    allOut: z.boolean().default(false),
    notes: z.string().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.battingTeamId === data.bowlingTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Batting team and bowling team must be different",
        path: ["bowlingTeamId"],
      });
    }
  });

// ─── Batting entry schema ─────────────────────────────────────────────────────

export const battingEntrySchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
  battingPosition: z.number().int().min(1).max(15).optional().nullable(),
  runs: z.number().int().min(0, "Runs cannot be negative"),
  balls: z.number().int().min(0, "Balls cannot be negative"),
  fours: z.number().int().min(0).default(0),
  sixes: z.number().int().min(0).default(0),
  minutes: z.number().int().min(0).optional().nullable(),
  dismissalType: z.enum(DISMISSAL_TYPES).optional().nullable(),
  bowlerPlayerId: z.string().uuid().optional().nullable(),
  fielderPlayerId: z.string().uuid().optional().nullable(),
  isOut: z.boolean().default(false),
  didNotBat: z.boolean().default(false),
  retiredHurt: z.boolean().default(false),
  retiredOut: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

export const battingEntriesSchema = z.object({
  inningsId: z.string().uuid(),
  matchId: z.string().uuid(),
  teamId: z.string().uuid(),
  entries: z.array(battingEntrySchema),
});

// ─── Bowling entry schema ─────────────────────────────────────────────────────

export const bowlingEntrySchema = z.object({
  playerId: z.string().uuid("Invalid player ID"),
  ballsBowled: z.number().int().min(0),
  maidens: z.number().int().min(0).default(0),
  runsConceded: z.number().int().min(0),
  wickets: z.number().int().min(0).max(10),
  wides: z.number().int().min(0).default(0),
  noBalls: z.number().int().min(0).default(0),
  dots: z.number().int().min(0).default(0),
  foursConceded: z.number().int().min(0).default(0),
  sixesConceded: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const bowlingEntriesSchema = z.object({
  inningsId: z.string().uuid(),
  matchId: z.string().uuid(),
  teamId: z.string().uuid(),
  entries: z.array(bowlingEntrySchema),
});

// ─── Result finalization schema ───────────────────────────────────────────────

export const resultFinalizationSchema = z.object({
  matchId: z.string().uuid(),
  resultType: z.enum(RESULT_TYPES),
  winningTeamId: z.string().uuid().optional().nullable(),
  losingTeamId: z.string().uuid().optional().nullable(),
  marginRuns: z.number().int().min(0).optional().nullable(),
  marginWickets: z.number().int().min(0).max(10).optional().nullable(),
  marginBallsRemaining: z.number().int().min(0).optional().nullable(),
  playerOfMatchId: z.string().uuid().optional().nullable(),
  resultSummary: z.string().max(500).optional().nullable(),
});

export type MatchSetupInput = z.infer<typeof matchSetupSchema>;
export type SaveSquadsInput = z.infer<typeof saveSquadsSchema>;
export type TossInput = z.infer<typeof tossSchema>;
export type InningsInput = z.infer<typeof inningsSchema>;
export type BattingEntryInput = z.infer<typeof battingEntrySchema>;
export type BattingEntriesInput = z.infer<typeof battingEntriesSchema>;
export type BowlingEntryInput = z.infer<typeof bowlingEntrySchema>;
export type BowlingEntriesInput = z.infer<typeof bowlingEntriesSchema>;
export type ResultFinalizationInput = z.infer<typeof resultFinalizationSchema>;
