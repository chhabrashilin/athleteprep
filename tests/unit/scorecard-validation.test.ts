import { describe, it, expect } from "vitest";
import {
  saveSquadsSchema,
  tossSchema,
  inningsSchema,
  battingEntrySchema,
  bowlingEntrySchema,
  resultFinalizationSchema,
} from "@/lib/cricket/validation/scorecard";

const MATCH_ID = "12345678-1234-4000-8abc-123456789abc";
const HOME_ID  = "23456789-2345-4000-9abc-234567890abc";
const AWAY_ID  = "34567890-3456-4000-aabc-345678901abc";
const PLAYER_A = "45678901-4567-4000-babc-456789012abc";
const PLAYER_B = "56789012-5678-4000-8bcd-567890123abc";

describe("saveSquadsSchema", () => {
  const validInput = {
    matchId: MATCH_ID,
    homeTeamId: HOME_ID,
    awayTeamId: AWAY_ID,
    homeSquad: [{ playerId: PLAYER_A, isPlayingXi: true }],
    awaySquad: [{ playerId: PLAYER_B, isPlayingXi: true }],
  };

  it("accepts valid squads", () => {
    expect(saveSquadsSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects duplicate players in home squad", () => {
    const result = saveSquadsSchema.safeParse({
      ...validInput,
      homeSquad: [
        { playerId: PLAYER_A, isPlayingXi: true },
        { playerId: PLAYER_A, isPlayingXi: false },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("duplicate");
    }
  });

  it("rejects more than 15 players per squad", () => {
    const bigSquad = Array.from({ length: 16 }, (_, i) => ({
      playerId: `1234${i.toString().padStart(4, "0")}-1234-4000-8abc-123456789abc`,
      isPlayingXi: true,
    }));
    const result = saveSquadsSchema.safeParse({ ...validInput, homeSquad: bigSquad });
    expect(result.success).toBe(false);
  });
});

describe("tossSchema", () => {
  it("accepts valid toss with home winner", () => {
    const result = tossSchema.safeParse({
      tossWinnerTeamId: HOME_ID,
      tossDecision: "bat",
      homeTeamId: HOME_ID,
      awayTeamId: AWAY_ID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects toss winner who is neither home nor away", () => {
    const result = tossSchema.safeParse({
      tossWinnerTeamId: PLAYER_A,
      tossDecision: "bat",
      homeTeamId: HOME_ID,
      awayTeamId: AWAY_ID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("home or away");
    }
  });

  it("rejects invalid toss decision", () => {
    const result = tossSchema.safeParse({
      tossWinnerTeamId: HOME_ID,
      tossDecision: "run",
      homeTeamId: HOME_ID,
      awayTeamId: AWAY_ID,
    });
    expect(result.success).toBe(false);
  });
});

describe("inningsSchema", () => {
  const validInnings = {
    matchId: MATCH_ID,
    inningsNumber: 1,
    battingTeamId: HOME_ID,
    bowlingTeamId: AWAY_ID,
    totalRuns: 142,
    wicketsLost: 7,
    ballsBowled: 120,
  };

  it("accepts valid innings", () => {
    expect(inningsSchema.safeParse(validInnings).success).toBe(true);
  });

  it("rejects negative runs", () => {
    expect(inningsSchema.safeParse({ ...validInnings, totalRuns: -1 }).success).toBe(false);
  });

  it("rejects wickets > 10", () => {
    expect(inningsSchema.safeParse({ ...validInnings, wicketsLost: 11 }).success).toBe(false);
  });

  it("rejects same batting and bowling team", () => {
    const result = inningsSchema.safeParse({
      ...validInnings,
      bowlingTeamId: HOME_ID,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("different");
    }
  });

  it("rejects negative balls", () => {
    expect(inningsSchema.safeParse({ ...validInnings, ballsBowled: -5 }).success).toBe(false);
  });
});

describe("battingEntrySchema", () => {
  const validEntry = {
    playerId: PLAYER_A,
    runs: 45,
    balls: 32,
    fours: 5,
    sixes: 1,
    isOut: true,
    dismissalType: "caught",
  };

  it("accepts valid entry", () => {
    expect(battingEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it("rejects negative runs", () => {
    expect(battingEntrySchema.safeParse({ ...validEntry, runs: -1 }).success).toBe(false);
  });

  it("rejects invalid batting position", () => {
    expect(battingEntrySchema.safeParse({ ...validEntry, battingPosition: 16 }).success).toBe(false);
  });

  it("accepts did not bat", () => {
    expect(battingEntrySchema.safeParse({
      ...validEntry,
      isOut: false,
      didNotBat: true,
      runs: 0,
      balls: 0,
    }).success).toBe(true);
  });
});

describe("bowlingEntrySchema", () => {
  const validEntry = {
    playerId: PLAYER_A,
    ballsBowled: 24,
    maidens: 1,
    runsConceded: 32,
    wickets: 2,
    wides: 3,
    noBalls: 1,
  };

  it("accepts valid entry", () => {
    expect(bowlingEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it("rejects negative balls", () => {
    expect(bowlingEntrySchema.safeParse({ ...validEntry, ballsBowled: -1 }).success).toBe(false);
  });

  it("rejects wickets > 10", () => {
    expect(bowlingEntrySchema.safeParse({ ...validEntry, wickets: 11 }).success).toBe(false);
  });

  it("rejects negative runs conceded", () => {
    expect(bowlingEntrySchema.safeParse({ ...validEntry, runsConceded: -5 }).success).toBe(false);
  });
});

describe("resultFinalizationSchema", () => {
  it("accepts valid home win", () => {
    const result = resultFinalizationSchema.safeParse({
      matchId: MATCH_ID,
      resultType: "home_win",
      winningTeamId: HOME_ID,
      losingTeamId: AWAY_ID,
      marginRuns: 4,
    });
    expect(result.success).toBe(true);
  });

  it("accepts no_result", () => {
    expect(resultFinalizationSchema.safeParse({
      matchId: MATCH_ID,
      resultType: "no_result",
    }).success).toBe(true);
  });

  it("rejects invalid result type", () => {
    expect(resultFinalizationSchema.safeParse({
      matchId: MATCH_ID,
      resultType: "invalid_type",
    }).success).toBe(false);
  });

  it("rejects negative margin runs", () => {
    expect(resultFinalizationSchema.safeParse({
      matchId: MATCH_ID,
      resultType: "home_win",
      marginRuns: -1,
    }).success).toBe(false);
  });
});
