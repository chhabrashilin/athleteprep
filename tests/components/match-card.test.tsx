import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MatchCard } from "@/components/cricket/MatchCard";
import type { CricketMatchFull } from "@/lib/cricket/types";

const baseMatch = {
  id: "m1",
  leagueId: "l1",
  homeTeamId: "t1",
  awayTeamId: "t2",
  venueId: null,
  matchType: "T20",
  matchStatus: "scheduled",
  scheduledStart: "2026-06-07T10:00:00.000Z",
  oversPerInnings: 20,
  tossWinnerTeamId: null,
  tossDecision: null,
  winnerTeamId: null,
  resultSummary: null,
  createdBy: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  slug: "strikers-vs-royals-2026-06-07",
  matchNumber: 1,
  roundName: "Round 1",
  groupName: null,
  stage: "league",
  title: null,
  scheduledEnd: "2026-06-07T14:00:00.000Z",
  timezone: "America/New_York",
  publishStatus: "draft",
  scheduleStatus: "scheduled",
  homeTeamLabel: null,
  awayTeamLabel: null,
  neutralMatch: false,
  scorerUserId: null,
  primaryUmpireName: null,
  secondaryUmpireName: null,
  matchRefereeName: null,
  livestreamUrl: null,
  notes: null,
  internalNotes: null,
  weatherNotes: null,
  cancellationReason: null,
  rescheduledFrom: null,
  publishedAt: null,
  archivedAt: null,
  matchResultType: null,
  resultMarginRuns: null,
  resultMarginWickets: null,
  resultMarginBallsRemaining: null,
  playerOfMatchId: null,
  resultConfirmedBy: null,
  resultConfirmedAt: null,
  scorecardStatus: "not_started" as const,
  scoringMode: "manual_scorecard",
  targetRuns: null,
  winningTeamId: null,
  losingTeamId: null,
} as CricketMatchFull;

describe("MatchCard", () => {
  it("renders team names", () => {
    render(
      <MatchCard
        match={baseMatch}
        homeTeamName="Madison Strikers"
        awayTeamName="Ann Arbor Royals"
      />
    );
    expect(screen.getAllByText(/Madison Strikers/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ann Arbor Royals/).length).toBeGreaterThan(0);
  });

  it("renders match number", () => {
    render(<MatchCard match={baseMatch} homeTeamName="Team A" awayTeamName="Team B" />);
    expect(screen.getByText("Match #1")).toBeInTheDocument();
  });

  it("renders round name", () => {
    render(<MatchCard match={baseMatch} homeTeamName="Team A" awayTeamName="Team B" />);
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });

  it("renders scheduled badge", () => {
    render(<MatchCard match={baseMatch} homeTeamName="A" awayTeamName="B" />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("renders draft badge", () => {
    render(<MatchCard match={baseMatch} homeTeamName="A" awayTeamName="B" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders venue name when provided", () => {
    render(
      <MatchCard
        match={baseMatch}
        homeTeamName="A"
        awayTeamName="B"
        venueName="Madison Cricket Ground"
      />
    );
    expect(screen.getByText("Madison Cricket Ground")).toBeInTheDocument();
  });

  it("renders cancelled status correctly", () => {
    render(
      <MatchCard
        match={{ ...baseMatch, scheduleStatus: "cancelled" }}
        homeTeamName="A"
        awayTeamName="B"
      />
    );
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("shows edit actions when canManage and showActions", () => {
    render(
      <MatchCard
        match={baseMatch}
        homeTeamName="A"
        awayTeamName="B"
        showActions
        canManage
        leagueSlug="test-league"
      />
    );
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
