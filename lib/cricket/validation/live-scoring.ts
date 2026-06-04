/**
 * lib/cricket/validation/live-scoring.ts
 * Zod schemas for live ball-by-ball scoring.
 */

import { z } from "zod";

const UUID = z.string().uuid();

// ─── startLiveScoringSchema ───────────────────────────────────────────────────

export const startLiveScoringSchema = z.object({
  match_id:         UUID,
  innings_id:       UUID.optional(),
  batting_team_id:  UUID,
  bowling_team_id:  UUID,
  striker_id:       UUID,
  non_striker_id:   UUID,
  bowler_id:        UUID,
}).refine((d) => d.striker_id !== d.non_striker_id, {
  message: "Striker and non-striker must be different players",
  path: ["non_striker_id"],
});

export type StartLiveScoringInput = z.infer<typeof startLiveScoringSchema>;

// ─── ballEventSchema ──────────────────────────────────────────────────────────

const EXTRA_TYPES = [
  "wide", "no_ball", "bye", "leg_bye", "penalty",
  "no_ball_bye", "no_ball_leg_bye",
] as const;

const WICKET_TYPES = [
  "bowled", "caught", "caught_behind", "lbw", "run_out", "stumped",
  "hit_wicket", "retired_hurt", "retired_out", "obstructing_field",
  "hit_ball_twice", "timed_out", "absent_hurt", "other",
] as const;

const WICKET_TYPES_REQUIRING_PLAYER_OUT = new Set([
  "bowled", "caught", "caught_behind", "lbw", "run_out", "stumped", "hit_wicket",
]);

export const ballEventSchema = z.object({
  match_id:          UUID,
  innings_id:        UUID,
  over_number:       z.number().int().min(0),
  ball_in_over:      z.number().int().min(0).max(9),
  striker_id:        UUID,
  non_striker_id:    UUID,
  bowler_id:         UUID,
  runs_batter:       z.number().int().min(0).max(36, { message: "Batter runs must be 0–36" }),
  runs_extras:       z.number().int().min(0).max(10),
  extra_type:        z.enum(EXTRA_TYPES).optional().nullable(),
  wicket_type:       z.enum(WICKET_TYPES).optional().nullable(),
  player_out_id:     UUID.optional().nullable(),
  fielder_player_id: UUID.optional().nullable(),
  commentary:        z.string().max(500).optional().nullable(),
  shot_type:         z.string().max(100).optional().nullable(),
  fielding_position: z.string().max(100).optional().nullable(),
  wagon_zone:        z.string().max(50).optional().nullable(),
  bat_contact_type:  z.string().max(50).optional().nullable(),
}).refine((d) => d.striker_id !== d.non_striker_id, {
  message: "Striker and non-striker must be different players",
  path: ["non_striker_id"],
}).refine((d) => {
  // Wide: batter cannot score runs
  if (d.extra_type === "wide" && d.runs_batter > 0) return false;
  return true;
}, {
  message: "Batter cannot score runs off a wide",
  path: ["runs_batter"],
}).refine((d) => {
  // Wicket without player_out for dismissal types that require it
  if (d.wicket_type && WICKET_TYPES_REQUIRING_PLAYER_OUT.has(d.wicket_type) && !d.player_out_id) {
    return false;
  }
  return true;
}, {
  message: "Player out is required for this dismissal type",
  path: ["player_out_id"],
}).refine((d) => {
  // Bye/leg-bye must have at least 1 extra run
  if ((d.extra_type === "bye" || d.extra_type === "leg_bye") && d.runs_extras === 0) {
    return false;
  }
  return true;
}, {
  message: "Byes/leg-byes must have at least 1 extra run",
  path: ["runs_extras"],
});

export type BallEventInput = z.infer<typeof ballEventSchema>;

// ─── correctionSchema ─────────────────────────────────────────────────────────

const CORRECTION_TYPES = ["undo", "edit", "delete", "replace", "innings_rebuild"] as const;

export const correctionSchema = z.object({
  event_id:          UUID,
  correction_type:   z.enum(CORRECTION_TYPES),
  reason:            z.string().max(1000).optional().nullable(),
  replacement_event: ballEventSchema.optional().nullable(),
});

export type CorrectionInput = z.infer<typeof correctionSchema>;

// ─── endInningsSchema ─────────────────────────────────────────────────────────

export const endInningsSchema = z.object({
  match_id:   UUID,
  innings_id: UUID,
  reason:     z.enum(["all_out", "overs_complete", "declared", "forced"]).optional(),
  notes:      z.string().max(500).optional().nullable(),
});

export type EndInningsInput = z.infer<typeof endInningsSchema>;

// ─── pauseResumeSchema ────────────────────────────────────────────────────────

export const pauseResumeSchema = z.object({
  match_id: UUID,
  reason:   z.string().max(200).optional().nullable(),
});

export type PauseResumeInput = z.infer<typeof pauseResumeSchema>;
