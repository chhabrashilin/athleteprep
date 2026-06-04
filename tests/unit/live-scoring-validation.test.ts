import { describe, it, expect } from "vitest";
import {
  startLiveScoringSchema,
  ballEventSchema,
  correctionSchema,
} from "@/lib/cricket/validation/live-scoring";

// Valid RFC 4122 UUID v4 values
const MATCH_ID  = "254a9b79-391a-477d-9ced-161997fdf76a";
const INNINGS_ID= "f573805f-077a-49e2-a6a2-041e5b814aff";
const TEAM_A    = "e69fd364-461f-4ed8-bf55-a9d7a4a93af6";
const TEAM_B    = "2cb429dc-4535-42a2-ad75-be492d722b20";
const PLAYER_1  = "13ff5ed5-a7c3-46cb-821b-c72d22fb9e94";
const PLAYER_2  = "199240e5-47ea-4446-bf81-cac9d8f1fa54";
const PLAYER_3  = "9459a5b5-e284-444f-bdaf-b15fe2117a02";
const EVENT_ID  = "991c700c-94be-4416-9ee5-a594f492c222";

// ─── startLiveScoringSchema ───────────────────────────────────────────────────

describe("startLiveScoringSchema", () => {
  it("valid input passes", () => {
    const result = startLiveScoringSchema.safeParse({
      match_id: MATCH_ID,
      batting_team_id: TEAM_A,
      bowling_team_id: TEAM_B,
      striker_id: PLAYER_1,
      non_striker_id: PLAYER_2,
      bowler_id: PLAYER_3,
    });
    expect(result.success).toBe(true);
  });

  it("same striker and non-striker fails", () => {
    const result = startLiveScoringSchema.safeParse({
      match_id: MATCH_ID,
      batting_team_id: TEAM_A,
      bowling_team_id: TEAM_B,
      striker_id: PLAYER_1,
      non_striker_id: PLAYER_1,
      bowler_id: PLAYER_3,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("different");
  });

  it("invalid UUID fails", () => {
    const result = startLiveScoringSchema.safeParse({
      match_id: "not-a-uuid",
      batting_team_id: TEAM_A,
      bowling_team_id: TEAM_B,
      striker_id: PLAYER_1,
      non_striker_id: PLAYER_2,
      bowler_id: PLAYER_3,
    });
    expect(result.success).toBe(false);
  });
});

// ─── ballEventSchema ──────────────────────────────────────────────────────────

const baseEvent = {
  match_id: MATCH_ID,
  innings_id: INNINGS_ID,
  over_number: 0,
  ball_in_over: 0,
  striker_id: PLAYER_1,
  non_striker_id: PLAYER_2,
  bowler_id: PLAYER_3,
  runs_batter: 0,
  runs_extras: 0,
};

describe("ballEventSchema — valid normal ball", () => {
  it("dot ball passes", () => {
    expect(ballEventSchema.safeParse(baseEvent).success).toBe(true);
  });
  it("single passes", () => {
    expect(ballEventSchema.safeParse({ ...baseEvent, runs_batter: 1 }).success).toBe(true);
  });
  it("four passes", () => {
    expect(ballEventSchema.safeParse({ ...baseEvent, runs_batter: 4 }).success).toBe(true);
  });
  it("six passes", () => {
    expect(ballEventSchema.safeParse({ ...baseEvent, runs_batter: 6 }).success).toBe(true);
  });
});

describe("ballEventSchema — valid wide", () => {
  it("wide with 0 batter runs passes", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      runs_batter: 0,
      runs_extras: 1,
      extra_type: "wide",
    });
    expect(result.success).toBe(true);
  });
});

describe("ballEventSchema — valid no ball", () => {
  it("no ball passes", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      runs_batter: 0,
      runs_extras: 1,
      extra_type: "no_ball",
    });
    expect(result.success).toBe(true);
  });
});

describe("ballEventSchema — invalid negative runs", () => {
  it("negative batter runs fail", () => {
    const result = ballEventSchema.safeParse({ ...baseEvent, runs_batter: -1 });
    expect(result.success).toBe(false);
  });
  it("negative extras fail", () => {
    const result = ballEventSchema.safeParse({ ...baseEvent, runs_extras: -1 });
    expect(result.success).toBe(false);
  });
});

describe("ballEventSchema — invalid same striker/non-striker", () => {
  it("same player for striker and non-striker fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      non_striker_id: PLAYER_1,
    });
    expect(result.success).toBe(false);
  });
});

describe("ballEventSchema — invalid wicket missing player_out", () => {
  it("bowled without player_out_id fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      wicket_type: "bowled",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((e: { path: unknown[]; message: string }) => e.path.includes("player_out_id"))).toBe(true);
  });

  it("run_out without player_out_id fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      wicket_type: "run_out",
    });
    expect(result.success).toBe(false);
  });

  it("retired_hurt without player_out_id passes (not required)", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      wicket_type: "retired_hurt",
    });
    expect(result.success).toBe(true);
  });
});

describe("ballEventSchema — invalid wide with batter runs", () => {
  it("wide + batter runs fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      runs_batter: 2,
      runs_extras: 1,
      extra_type: "wide",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((e: { path: unknown[]; message: string }) => e.message.includes("wide"))).toBe(true);
  });
});

describe("ballEventSchema — invalid bye without extras", () => {
  it("bye with 0 extras fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      runs_batter: 0,
      runs_extras: 0,
      extra_type: "bye",
    });
    expect(result.success).toBe(false);
  });
});

describe("ballEventSchema — commentary length", () => {
  it("commentary over 500 chars fails", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      commentary: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("commentary of 500 chars passes", () => {
    const result = ballEventSchema.safeParse({
      ...baseEvent,
      commentary: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

// ─── correctionSchema ─────────────────────────────────────────────────────────

describe("correctionSchema", () => {
  it("valid undo passes", () => {
    const result = correctionSchema.safeParse({
      event_id: EVENT_ID,
      correction_type: "undo",
      reason: "Scorer error",
    });
    expect(result.success).toBe(true);
  });

  it("invalid correction_type fails", () => {
    const result = correctionSchema.safeParse({
      event_id: EVENT_ID,
      correction_type: "wrong_type",
    });
    expect(result.success).toBe(false);
  });

  it("reason over 1000 chars fails", () => {
    const result = correctionSchema.safeParse({
      event_id: EVENT_ID,
      correction_type: "edit",
      reason: "r".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
