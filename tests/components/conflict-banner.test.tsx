import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ConflictBanner, ConflictsPanel } from "@/components/cricket/ConflictBanner";
import type { ScheduleConflict } from "@/lib/cricket/types";

const sampleConflict: ScheduleConflict = {
  type: "team_double_booked",
  description: "Matches 1 and 2: Team A is double-booked at overlapping times",
  suggestion: "Reschedule one of the matches to a different date or time.",
};

describe("ConflictBanner", () => {
  it("renders nothing when no conflicts", () => {
    const { container } = render(
      <ConflictBanner conflicts={[]} leagueSlug="test-league" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders conflict count", () => {
    render(<ConflictBanner conflicts={[sampleConflict]} leagueSlug="test-league" />);
    expect(screen.getByText(/1 schedule conflict detected/)).toBeInTheDocument();
  });

  it("renders plural for multiple conflicts", () => {
    render(
      <ConflictBanner
        conflicts={[sampleConflict, sampleConflict]}
        leagueSlug="test-league"
      />
    );
    expect(screen.getByText(/2 schedule conflicts detected/)).toBeInTheDocument();
  });

  it("renders review link", () => {
    render(<ConflictBanner conflicts={[sampleConflict]} leagueSlug="my-league" />);
    const link = screen.getByText("Review conflicts →");
    expect(link).toBeInTheDocument();
  });
});

describe("ConflictsPanel", () => {
  it("shows success message when no conflicts", () => {
    render(<ConflictsPanel conflicts={[]} />);
    expect(screen.getByText("No schedule conflicts found.")).toBeInTheDocument();
  });

  it("shows conflict details", () => {
    render(<ConflictsPanel conflicts={[sampleConflict]} />);
    expect(screen.getByText(/team double booked/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Team A is double-booked at overlapping times/)
    ).toBeInTheDocument();
  });

  it("shows suggestion", () => {
    render(<ConflictsPanel conflicts={[sampleConflict]} />);
    expect(screen.getByText(/Reschedule one/)).toBeInTheDocument();
  });
});
