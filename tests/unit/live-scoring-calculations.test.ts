import { describe, it, expect } from "vitest";
import {
  isLegalDelivery,
  calculateRunsTotal,
  shouldRotateStrike,
  getNextBallState,
  calculateLiveRunRate,
  calculateLiveRequiredRunRate,
  buildCommentaryLine,
  buildEventNotation,
  summarizeOver,
  rebuildInningsStateFromEvents,
  validateBallEventInput,
  type BallEventInput,
  type InningsState,
} from "@/lib/cricket/live-scoring/calculations";

// ─── isLegalDelivery ─────────────────────────────────────────────────────────

describe("isLegalDelivery", () => {
  it("normal ball is legal", () => {
    expect(isLegalDelivery({})).toBe(true);
  });
  it("wide is not legal", () => {
    expect(isLegalDelivery({ extraType: "wide" })).toBe(false);
  });
  it("no_ball is not legal", () => {
    expect(isLegalDelivery({ extraType: "no_ball" })).toBe(false);
  });
  it("no_ball_bye is not legal", () => {
    expect(isLegalDelivery({ extraType: "no_ball_bye" })).toBe(false);
  });
  it("no_ball_leg_bye is not legal", () => {
    expect(isLegalDelivery({ extraType: "no_ball_leg_bye" })).toBe(false);
  });
  it("bye is legal", () => {
    expect(isLegalDelivery({ extraType: "bye" })).toBe(true);
  });
  it("leg_bye is legal", () => {
    expect(isLegalDelivery({ extraType: "leg_bye" })).toBe(true);
  });
  it("penalty is legal", () => {
    expect(isLegalDelivery({ extraType: "penalty" })).toBe(true);
  });
});

// ─── calculateRunsTotal ───────────────────────────────────────────────────────

describe("calculateRunsTotal", () => {
  it("normal dot ball = 0", () => {
    expect(calculateRunsTotal({ runsBatter: 0, runsExtras: 0 })).toBe(0);
  });
  it("single = 1", () => {
    expect(calculateRunsTotal({ runsBatter: 1, runsExtras: 0 })).toBe(1);
  });
  it("boundary four = 4", () => {
    expect(calculateRunsTotal({ runsBatter: 4, runsExtras: 0 })).toBe(4);
  });
  it("boundary six = 6", () => {
    expect(calculateRunsTotal({ runsBatter: 6, runsExtras: 0 })).toBe(6);
  });
  it("wide 1 = 1", () => {
    expect(calculateRunsTotal({ runsBatter: 0, runsExtras: 1 })).toBe(1);
  });
  it("wide 2 = 2", () => {
    expect(calculateRunsTotal({ runsBatter: 0, runsExtras: 2 })).toBe(2);
  });
  it("no-ball + 1 run = 2 (1+1)", () => {
    expect(calculateRunsTotal({ runsBatter: 1, runsExtras: 1 })).toBe(2);
  });
});

// ─── shouldRotateStrike ──────────────────────────────────────────────────────

describe("shouldRotateStrike", () => {
  it("single rotates strike", () => {
    const result = shouldRotateStrike({ runsBatter: 1, runsExtras: 0, extraType: null, wicketType: null }, false);
    expect(result.rotate).toBe(true);
  });
  it("even runs (2) do not rotate", () => {
    const result = shouldRotateStrike({ runsBatter: 2, runsExtras: 0, extraType: null, wicketType: null }, false);
    expect(result.rotate).toBe(false);
  });
  it("dot ball does not rotate", () => {
    const result = shouldRotateStrike({ runsBatter: 0, runsExtras: 0, extraType: null, wicketType: null }, false);
    expect(result.rotate).toBe(false);
  });
  it("four does not rotate", () => {
    const result = shouldRotateStrike({ runsBatter: 4, runsExtras: 0, extraType: null, wicketType: null }, false);
    expect(result.rotate).toBe(false);
  });
  it("six does not rotate", () => {
    const result = shouldRotateStrike({ runsBatter: 6, runsExtras: 0, extraType: null, wicketType: null }, false);
    expect(result.rotate).toBe(false);
  });
  it("end of over always rotates", () => {
    const result = shouldRotateStrike({ runsBatter: 4, runsExtras: 0, extraType: null, wicketType: null }, true);
    expect(result.rotate).toBe(true);
    expect(result.reason).toBe("end_of_over");
  });
  it("wide does not rotate on runs", () => {
    const result = shouldRotateStrike({ runsBatter: 0, runsExtras: 1, extraType: "wide", wicketType: null }, false);
    expect(result.rotate).toBe(false);
  });
  it("wicket does not auto-rotate (new batter needed)", () => {
    const result = shouldRotateStrike({ runsBatter: 0, runsExtras: 0, extraType: null, wicketType: "bowled" }, false);
    expect(result.rotate).toBe(false);
    expect(result.reason).toBe("wicket_new_batter");
  });
  it("wicket at end of over rotates non-striker", () => {
    const result = shouldRotateStrike({ runsBatter: 0, runsExtras: 0, extraType: null, wicketType: "bowled" }, true);
    expect(result.rotate).toBe(true);
  });
  it("odd bye runs rotate", () => {
    const result = shouldRotateStrike({ runsBatter: 0, runsExtras: 1, extraType: "bye", wicketType: null }, false);
    expect(result.rotate).toBe(true);
  });
});

// ─── getNextBallState ─────────────────────────────────────────────────────────

const baseState: InningsState = {
  totalRuns: 0,
  wicketsLost: 0,
  ballsBowled: 0,
  extrasTotal: 0,
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  penaltyRuns: 0,
  strikerId: "batter-1",
  nonStrikerId: "batter-2",
  bowlerId: "bowler-1",
};

describe("getNextBallState — dot ball", () => {
  const event: BallEventInput = { runsBatter: 0, runsExtras: 0, isBoundaryFour: false, isBoundarySix: false };
  const next = getNextBallState(baseState, event);
  it("increments balls bowled", () => { expect(next.ballsBowled).toBe(1); });
  it("does not add runs", () => { expect(next.totalRuns).toBe(0); });
  it("does not rotate strike", () => { expect(next.strikerId).toBe("batter-1"); });
  it("not over complete after 1 ball", () => { expect(next.isOverComplete).toBe(false); });
});

describe("getNextBallState — single", () => {
  const event: BallEventInput = { runsBatter: 1, runsExtras: 0 };
  const next = getNextBallState(baseState, event);
  it("adds 1 run", () => { expect(next.totalRuns).toBe(1); });
  it("increments balls bowled", () => { expect(next.ballsBowled).toBe(1); });
  it("rotates strike", () => { expect(next.strikerId).toBe("batter-2"); });
  it("non-striker is previous striker", () => { expect(next.nonStrikerId).toBe("batter-1"); });
});

describe("getNextBallState — boundary four", () => {
  const event: BallEventInput = { runsBatter: 4, runsExtras: 0, isBoundaryFour: true };
  const next = getNextBallState(baseState, event);
  it("adds 4 runs", () => { expect(next.totalRuns).toBe(4); });
  it("does not rotate", () => { expect(next.strikerId).toBe("batter-1"); });
});

describe("getNextBallState — boundary six", () => {
  const event: BallEventInput = { runsBatter: 6, runsExtras: 0, isBoundarySix: true };
  const next = getNextBallState(baseState, event);
  it("adds 6 runs", () => { expect(next.totalRuns).toBe(6); });
  it("does not rotate", () => { expect(next.strikerId).toBe("batter-1"); });
});

describe("getNextBallState — wide", () => {
  const event: BallEventInput = { runsBatter: 0, runsExtras: 1, extraType: "wide" };
  const next = getNextBallState(baseState, event);
  it("adds 1 run", () => { expect(next.totalRuns).toBe(1); });
  it("does NOT increment legal balls", () => { expect(next.ballsBowled).toBe(0); });
  it("does not rotate", () => { expect(next.strikerId).toBe("batter-1"); });
});

describe("getNextBallState — no ball", () => {
  const event: BallEventInput = { runsBatter: 0, runsExtras: 1, extraType: "no_ball" };
  const next = getNextBallState(baseState, event);
  it("adds runs", () => { expect(next.totalRuns).toBe(1); });
  it("does NOT increment legal balls", () => { expect(next.ballsBowled).toBe(0); });
});

describe("getNextBallState — wicket (bowled)", () => {
  const event: BallEventInput = { runsBatter: 0, runsExtras: 0, wicketType: "bowled", playerOutId: "batter-1" };
  const next = getNextBallState(baseState, event);
  it("increments wickets", () => { expect(next.wicketsLost).toBe(1); });
  it("increments balls", () => { expect(next.ballsBowled).toBe(1); });
  it("striker is null (needs new batter)", () => { expect(next.strikerId).toBe(null); });
});

describe("getNextBallState — over completion after 6 legal balls", () => {
  const stateAt5: InningsState = { ...baseState, ballsBowled: 5 };
  const event: BallEventInput = { runsBatter: 0, runsExtras: 0 };
  const next = getNextBallState(stateAt5, event);
  it("marks over complete", () => { expect(next.isOverComplete).toBe(true); });
  it("rotates strike at end of over", () => { expect(next.strikerId).toBe("batter-2"); });
  it("ball count is 6", () => { expect(next.ballsBowled).toBe(6); });
});

// ─── calculateLiveRunRate ─────────────────────────────────────────────────────

describe("calculateLiveRunRate", () => {
  it("returns null if no balls bowled", () => {
    expect(calculateLiveRunRate(0, 0)).toBeNull();
  });
  it("returns 6.00 for 6 off 6 balls", () => {
    expect(calculateLiveRunRate(6, 6)).toBe(6.00);
  });
  it("returns 12.00 for 12 off 6 balls", () => {
    expect(calculateLiveRunRate(12, 6)).toBe(12.00);
  });
  it("rounds to 2 decimal places", () => {
    expect(calculateLiveRunRate(7, 6)).toBe(7.00);
  });
});

// ─── calculateLiveRequiredRunRate ─────────────────────────────────────────────

describe("calculateLiveRequiredRunRate", () => {
  it("returns null if no balls remaining", () => {
    expect(calculateLiveRequiredRunRate(150, 100, 0)).toBeNull();
  });
  it("returns 0 if target already met", () => {
    expect(calculateLiveRequiredRunRate(100, 110, 30)).toBe(0);
  });
  it("calculates correctly", () => {
    // 50 needed off 30 balls = 50/30*6 = 10.00
    expect(calculateLiveRequiredRunRate(150, 100, 30)).toBe(10.00);
  });
});

// ─── buildCommentaryLine ──────────────────────────────────────────────────────

describe("buildCommentaryLine", () => {
  it("returns dot ball commentary", () => {
    const line = buildCommentaryLine({ runsBatter: 0, runsExtras: 0 }, { overNumber: 0, ballInOver: 1, bowlerName: "Patel", strikerName: "Kumar" });
    expect(line).toContain("dot ball");
    expect(line).toContain("0.1");
    expect(line).toContain("Patel");
  });
  it("returns single commentary", () => {
    const line = buildCommentaryLine({ runsBatter: 1, runsExtras: 0 }, { overNumber: 1, ballInOver: 3, bowlerName: "Khan", strikerName: "Singh" });
    expect(line).toContain("1 run");
  });
  it("returns FOUR commentary", () => {
    const line = buildCommentaryLine({ runsBatter: 4, runsExtras: 0, isBoundaryFour: true }, { overNumber: 2, ballInOver: 5, bowlerName: "Ali", strikerName: "Rao" });
    expect(line).toContain("FOUR");
  });
  it("returns SIX commentary", () => {
    const line = buildCommentaryLine({ runsBatter: 6, runsExtras: 0, isBoundarySix: true }, { overNumber: 3, ballInOver: 2, bowlerName: "Ali", strikerName: "Rao" });
    expect(line).toContain("SIX");
  });
  it("returns wicket commentary", () => {
    const line = buildCommentaryLine({ runsBatter: 0, runsExtras: 0, wicketType: "caught" }, { overNumber: 4, ballInOver: 0, bowlerName: "Dev", strikerName: "Mehta", playerOutName: "Mehta", fielderName: "Sharma" });
    expect(line).toContain("OUT");
    expect(line).toContain("caught");
  });
  it("uses provided commentary if present", () => {
    const line = buildCommentaryLine({ runsBatter: 0, runsExtras: 0, commentary: "Custom commentary" }, { overNumber: 0, ballInOver: 0 });
    expect(line).toBe("Custom commentary");
  });
});

// ─── buildEventNotation ──────────────────────────────────────────────────────

describe("buildEventNotation", () => {
  it("dot ball = '0'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 0, extraType: null, wicketType: null })).toBe("0");
  });
  it("single = '1'", () => {
    expect(buildEventNotation({ runsBatter: 1, runsExtras: 0 })).toBe("1");
  });
  it("four = '4'", () => {
    expect(buildEventNotation({ runsBatter: 4, runsExtras: 0, isBoundaryFour: true })).toBe("4");
  });
  it("six = '6'", () => {
    expect(buildEventNotation({ runsBatter: 6, runsExtras: 0, isBoundarySix: true })).toBe("6");
  });
  it("wicket = 'W'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 0, wicketType: "bowled" })).toBe("W");
  });
  it("wide = 'WD'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 1, extraType: "wide" })).toBe("WD");
  });
  it("wide 2 = 'WD+1'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 2, extraType: "wide" })).toBe("WD+1");
  });
  it("no ball = 'NB'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 1, extraType: "no_ball" })).toBe("NB");
  });
  it("no ball + 1 = 'NB+1'", () => {
    expect(buildEventNotation({ runsBatter: 1, runsExtras: 1, extraType: "no_ball" })).toBe("NB+1");
  });
  it("bye = 'B1'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 1, extraType: "bye" })).toBe("B1");
  });
  it("leg bye = 'LB1'", () => {
    expect(buildEventNotation({ runsBatter: 0, runsExtras: 1, extraType: "leg_bye" })).toBe("LB1");
  });
  it("1 + wicket = '1+W'", () => {
    expect(buildEventNotation({ runsBatter: 1, runsExtras: 0, wicketType: "run_out" })).toBe("1+W");
  });
});

// ─── summarizeOver ───────────────────────────────────────────────────────────

describe("summarizeOver", () => {
  const overEvents: BallEventInput[] = [
    { runsBatter: 0, runsExtras: 0 },           // dot
    { runsBatter: 1, runsExtras: 0 },           // single
    { runsBatter: 4, runsExtras: 0, isBoundaryFour: true }, // four
    { runsBatter: 0, runsExtras: 1, extraType: "wide" }, // wide
    { runsBatter: 6, runsExtras: 0, isBoundarySix: true }, // six
    { runsBatter: 0, runsExtras: 0, wicketType: "bowled" }, // wicket
  ];

  const summary = summarizeOver(overEvents, 2);

  it("calculates runs in over", () => {
    expect(summary.runsInOver).toBe(12);
  });
  it("counts wickets", () => {
    expect(summary.wicketsInOver).toBe(1);
  });
  it("builds notation array", () => {
    expect(summary.notation).toHaveLength(6);
    expect(summary.notation[0]).toBe("0");
    expect(summary.notation[2]).toBe("4");
    expect(summary.notation[5]).toBe("W");
  });
  it("sets over number", () => {
    expect(summary.overNumber).toBe(2);
  });
});

// ─── rebuildInningsStateFromEvents ───────────────────────────────────────────

describe("rebuildInningsStateFromEvents", () => {
  const initial: InningsState = {
    totalRuns: 0, wicketsLost: 0, ballsBowled: 0, extrasTotal: 0,
    wides: 0, noBalls: 0, byes: 0, legByes: 0, penaltyRuns: 0,
    strikerId: "b1", nonStrikerId: "b2", bowlerId: "bow1",
  };

  it("returns initial state for empty events", () => {
    const result = rebuildInningsStateFromEvents([], initial);
    expect(result.totalRuns).toBe(0);
    expect(result.ballsBowled).toBe(0);
  });

  it("correctly sums runs and balls from events", () => {
    const events: BallEventInput[] = [
      { runsBatter: 0, runsExtras: 0 },  // dot
      { runsBatter: 4, runsExtras: 0 },  // four
      { runsBatter: 1, runsExtras: 0 },  // single
    ];
    const result = rebuildInningsStateFromEvents(events, initial);
    expect(result.totalRuns).toBe(5);
    expect(result.ballsBowled).toBe(3);
  });

  it("handles wide (not legal) correctly", () => {
    const events: BallEventInput[] = [
      { runsBatter: 0, runsExtras: 1, extraType: "wide" },  // wide
      { runsBatter: 1, runsExtras: 0 },
    ];
    const result = rebuildInningsStateFromEvents(events, initial);
    expect(result.totalRuns).toBe(2);
    expect(result.ballsBowled).toBe(1); // Only legal ball
  });

  it("increments wickets", () => {
    const events: BallEventInput[] = [
      { runsBatter: 0, runsExtras: 0, wicketType: "bowled", playerOutId: "b1" },
    ];
    const result = rebuildInningsStateFromEvents(events, initial);
    expect(result.wicketsLost).toBe(1);
  });

  it("rebuild after deleting last event gives correct state", () => {
    // Simulate: scored 1, 4, W — then undo W
    const allEvents: BallEventInput[] = [
      { runsBatter: 1, runsExtras: 0 },
      { runsBatter: 4, runsExtras: 0 },
      // W is deleted (not included in rebuild)
    ];
    const result = rebuildInningsStateFromEvents(allEvents, initial);
    expect(result.totalRuns).toBe(5);
    expect(result.wicketsLost).toBe(0);
    expect(result.ballsBowled).toBe(2);
  });
});

// ─── validateBallEventInput ───────────────────────────────────────────────────

describe("validateBallEventInput", () => {
  it("valid dot ball has no errors", () => {
    const errors = validateBallEventInput({ runsBatter: 0, runsExtras: 0 });
    expect(errors).toHaveLength(0);
  });

  it("negative batter runs triggers error", () => {
    const errors = validateBallEventInput({ runsBatter: -1, runsExtras: 0 });
    expect(errors.some((e) => e.field === "runsBatter")).toBe(true);
  });

  it("negative extras triggers error", () => {
    const errors = validateBallEventInput({ runsBatter: 0, runsExtras: -1 });
    expect(errors.some((e) => e.field === "runsExtras")).toBe(true);
  });

  it("wicket without playerOutId triggers error for bowled", () => {
    const errors = validateBallEventInput({ runsBatter: 0, runsExtras: 0, wicketType: "bowled" });
    expect(errors.some((e) => e.field === "playerOutId")).toBe(true);
  });

  it("wicket with playerOutId is valid", () => {
    const errors = validateBallEventInput({ runsBatter: 0, runsExtras: 0, wicketType: "bowled", playerOutId: "player-1" });
    expect(errors.filter((e) => e.field === "playerOutId")).toHaveLength(0);
  });

  it("wide with batter runs triggers error", () => {
    const errors = validateBallEventInput({ runsBatter: 1, runsExtras: 1, extraType: "wide" });
    expect(errors.some((e) => e.field === "runsBatter")).toBe(true);
  });

  it("bye with 0 extras triggers error", () => {
    const errors = validateBallEventInput({ runsBatter: 0, runsExtras: 0, extraType: "bye" });
    expect(errors.some((e) => e.field === "runsExtras")).toBe(true);
  });

  it("innings already 10 wickets triggers error", () => {
    const errors = validateBallEventInput(
      { runsBatter: 0, runsExtras: 0 },
      { wicketsAlreadyLost: 10 }
    );
    expect(errors.some((e) => e.field === "innings")).toBe(true);
  });
});
