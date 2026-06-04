import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ScorecardStatusBadge, BattingTable, BowlingTable, FOWDisplay } from "@/components/cricket/ScorecardDisplay";
import type { CricketBattingEntryWithPlayer, CricketBowlingEntryWithPlayer, CricketFallOfWicket } from "@/lib/cricket/types";

describe("ScorecardStatusBadge", () => {
  it("renders not_started", () => {
    render(<ScorecardStatusBadge status="not_started" />);
    expect(screen.getByText("Not Started")).toBeInTheDocument();
  });

  it("renders in_progress", () => {
    render(<ScorecardStatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders completed", () => {
    render(<ScorecardStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders locked", () => {
    render(<ScorecardStatusBadge status="locked" />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
});

const battingEntry: CricketBattingEntryWithPlayer = {
  id: "b1",
  inningsId: "i1",
  matchId: "m1",
  teamId: "t1",
  playerId: "p1",
  battingPosition: 1,
  runs: 45,
  balls: 32,
  fours: 5,
  sixes: 1,
  minutes: null,
  strikeRate: 140.63,
  dismissalType: "caught",
  dismissedByPlayerId: null,
  bowlerPlayerId: "p2",
  fielderPlayerId: null,
  isOut: true,
  didNotBat: false,
  retiredHurt: false,
  retiredOut: false,
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  playerName: "Alex Smith",
  playerSlug: null,
  bowlerName: "Bob Jones",
  fielderName: null,
};

const dnbEntry: CricketBattingEntryWithPlayer = {
  ...battingEntry,
  id: "b2",
  playerId: "p3",
  battingPosition: 11,
  runs: 0,
  balls: 0,
  didNotBat: true,
  isOut: false,
  playerName: "Charlie Brown",
};

describe("BattingTable", () => {
  it("renders player name", () => {
    render(<BattingTable entries={[battingEntry]} teamName="Test XI" />);
    expect(screen.getByText("Alex Smith")).toBeInTheDocument();
  });

  it("renders runs", () => {
    render(<BattingTable entries={[battingEntry]} teamName="Test XI" />);
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("renders did not bat indicator", () => {
    render(<BattingTable entries={[dnbEntry]} teamName="Test XI" />);
    expect(screen.getAllByText("did not bat").length).toBeGreaterThan(0);
  });

  it("renders empty state when no entries", () => {
    render(<BattingTable entries={[]} teamName="Test XI" />);
    expect(screen.getByText("No batting data yet")).toBeInTheDocument();
  });

  it("renders team name header", () => {
    render(<BattingTable entries={[battingEntry]} teamName="Madison XI" />);
    expect(screen.getByText(/Madison XI/)).toBeInTheDocument();
  });
});

const bowlingEntry: CricketBowlingEntryWithPlayer = {
  id: "bw1",
  inningsId: "i1",
  matchId: "m1",
  teamId: "t2",
  playerId: "p2",
  ballsBowled: 24,
  oversText: "4.0",
  maidens: 1,
  runsConceded: 28,
  wickets: 2,
  wides: 3,
  noBalls: 1,
  economyRate: 7,
  dots: 10,
  foursConceded: 2,
  sixesConceded: 0,
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  playerName: "Bob Jones",
  playerSlug: null,
};

describe("BowlingTable", () => {
  it("renders player name", () => {
    render(<BowlingTable entries={[bowlingEntry]} teamName="Bowling XI" />);
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders wickets", () => {
    render(<BowlingTable entries={[bowlingEntry]} teamName="Bowling XI" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<BowlingTable entries={[]} teamName="Bowling XI" />);
    expect(screen.getByText("No bowling data yet")).toBeInTheDocument();
  });
});

const fow: CricketFallOfWicket = {
  id: "fow1",
  inningsId: "i1",
  matchId: "m1",
  wicketNumber: 1,
  teamScore: 45,
  ballsElapsed: 32,
  oversText: "5.2",
  playerOutId: null,
  partnershipRuns: 45,
  partnershipBalls: 32,
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("FOWDisplay", () => {
  it("renders nothing for empty FOW", () => {
    const { container } = render(<FOWDisplay fow={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders FOW entry", () => {
    render(<FOWDisplay fow={[fow]} />);
    expect(screen.getByText(/1-45/)).toBeInTheDocument();
  });
});

describe("Scorecard empty state", () => {
  it("MatchSetupChecklist renders correctly", async () => {
    const { MatchSetupChecklist } = await import("@/components/cricket/MatchSetupChecklist");
    const mockMatch = {
      id: "m1",
      homeTeamId: "t1",
      awayTeamId: "t2",
      tossWinnerTeamId: null,
      tossDecision: null,
      scorecardStatus: "not_started" as const,
    };
    render(
      <MatchSetupChecklist
        match={mockMatch as unknown as Parameters<typeof MatchSetupChecklist>[0]["match"]}
        squads={[]}
        matchSlug="test-match"
      />
    );
    expect(screen.getByText("Setup Checklist")).toBeInTheDocument();
    expect(screen.getByText("Playing XI selected")).toBeInTheDocument();
    expect(screen.getByText("Toss recorded")).toBeInTheDocument();
  });
});
