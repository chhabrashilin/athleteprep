import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveMatchHeader } from "@/components/cricket/LiveMatchHeader";
import { RecentBallsList } from "@/components/cricket/RecentBallsList";
import type { CricketLiveMatchState, CricketBallEvent } from "@/lib/cricket/live-scoring/queries";

const mockLiveState: CricketLiveMatchState = {
  id: "state-1",
  matchId: "match-1",
  inningsId: "innings-1",
  battingTeamId: "team-a",
  bowlingTeamId: "team-b",
  totalRuns: 87,
  wicketsLost: 3,
  ballsBowled: 42,
  oversText: "7.0",
  extrasTotal: 6,
  currentRunRate: 7.43,
  requiredRunRate: null,
  targetRuns: null,
  strikerId: "player-1",
  nonStrikerId: "player-2",
  bowlerId: "player-3",
  lastEventId: null,
  status: "live",
  version: 12,
  updatedBy: null,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const mockPlayerNames: Record<string, string> = {
  "player-1": "Rohit Kumar",
  "player-2": "Virat Singh",
  "player-3": "Jasprit Patel",
};

const mockTeamNames: Record<string, string> = {
  "team-a": "Mumbai Tigers",
  "team-b": "Delhi Eagles",
};

// ─── LiveMatchHeader ──────────────────────────────────────────────────────────

describe("LiveMatchHeader", () => {
  it("renders batting team score", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("87/3")).toBeTruthy();
  });

  it("renders overs text", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("(7.0)")).toBeTruthy();
  });

  it("renders striker name", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("Rohit Kumar *")).toBeTruthy();
  });

  it("renders bowler name", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("Jasprit Patel")).toBeTruthy();
  });

  it("renders batting team name", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("Mumbai Tigers")).toBeTruthy();
  });

  it("renders CRR when available", () => {
    render(
      <LiveMatchHeader
        liveState={mockLiveState}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("7.43")).toBeTruthy();
  });

  it("renders target info when second innings", () => {
    const stateWithTarget = { ...mockLiveState, targetRuns: 150, requiredRunRate: 8.5 };
    render(
      <LiveMatchHeader
        liveState={stateWithTarget}
        playerNames={mockPlayerNames}
        teamNames={mockTeamNames}
      />
    );
    expect(screen.getByText("150")).toBeTruthy();
  });
});

// ─── RecentBallsList ──────────────────────────────────────────────────────────

const makeBallEvent = (overrides: Partial<CricketBallEvent> = {}): CricketBallEvent => ({
  id: `event-${Math.random()}`,
  matchId: "match-1",
  inningsId: "innings-1",
  battingTeamId: "team-a",
  bowlingTeamId: "team-b",
  overNumber: 0,
  ballInOver: 0,
  legalBallNumber: 1,
  inningsBallNumber: 1,
  strikerId: "player-1",
  nonStrikerId: "player-2",
  bowlerId: "player-3",
  runsBatter: 0,
  runsExtras: 0,
  runsTotal: 0,
  extraType: null,
  wicketType: null,
  playerOutId: null,
  dismissedByPlayerId: null,
  fielderPlayerId: null,
  isLegalDelivery: true,
  isWicket: false,
  isBoundaryFour: false,
  isBoundarySix: false,
  isDotBall: true,
  shotType: null,
  lineLength: null,
  fieldingPosition: null,
  commentary: null,
  scorerUserId: null,
  correctionOfEventId: null,
  isCorrection: false,
  isDeleted: false,
  deletedAt: null,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("RecentBallsList", () => {
  it("shows empty state when no events", () => {
    render(<RecentBallsList events={[]} />);
    expect(screen.getByText("No balls scored yet.")).toBeTruthy();
  });

  it("renders recent balls header", () => {
    const events = [makeBallEvent()];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("Recent Balls")).toBeTruthy();
  });

  it("shows dot ball notation", () => {
    const events = [makeBallEvent({ runsBatter: 0, runsExtras: 0, isDotBall: true })];
    render(<RecentBallsList events={events} />);
    const zeroBalls = screen.getAllByText("0");
    expect(zeroBalls.length).toBeGreaterThan(0);
  });

  it("shows wicket notation", () => {
    const events = [makeBallEvent({ wicketType: "bowled", isWicket: true, runsBatter: 0 })];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("W")).toBeTruthy();
  });

  it("shows four notation", () => {
    const events = [makeBallEvent({ runsBatter: 4, isBoundaryFour: true, isDotBall: false })];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("shows six notation", () => {
    const events = [makeBallEvent({ runsBatter: 6, isBoundarySix: true, isDotBall: false })];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("6")).toBeTruthy();
  });

  it("shows over label", () => {
    const events = [makeBallEvent({ overNumber: 3 })];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("Over 4")).toBeTruthy();
  });

  it("shows commentary in feed", () => {
    const events = [makeBallEvent({ commentary: "Bowled through the gate!" })];
    render(<RecentBallsList events={events} />);
    expect(screen.getByText("Bowled through the gate!")).toBeTruthy();
  });
});
