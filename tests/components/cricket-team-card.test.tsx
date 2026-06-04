import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamCard } from "@/components/cricket/TeamCard";
import type { CricketTeamFull } from "@/lib/cricket/types";

const BASE_TEAM: CricketTeamFull = {
  id: "b1000000-0000-0000-0000-000000000001",
  leagueId: "a1000000-0000-0000-0000-000000000001",
  existingTeamId: null,
  name: "Madison Strikers",
  shortName: "MDS",
  slug: "madison-strikers",
  logoUrl: null,
  primaryColor: "#0284c7",
  secondaryColor: null,
  homeGround: "Madison Cricket Ground",
  managerName: "Rajiv Kumar",
  managerEmail: null,
  createdBy: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  registrationStatus: "approved",
  approvalStatus: "approved",
  teamType: "club",
  description: null,
  foundedYear: 2018,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  instagramUrl: null,
  captainPlayerId: null,
  viceCaptainPlayerId: null,
  coachName: null,
  scorerName: null,
  isActive: true,
  archivedAt: null,
};

describe("TeamCard", () => {
  it("renders team name", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.getByText("Madison Strikers")).toBeDefined();
  });

  it("renders short name", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.getByText("(MDS)")).toBeDefined();
  });

  it("renders registration status badge", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.getByText("Approved")).toBeDefined();
  });

  it("renders home ground", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.getByText("Madison Cricket Ground")).toBeDefined();
  });

  it("renders roster count when provided", () => {
    render(<TeamCard team={BASE_TEAM} rosterCount={5} />);
    expect(screen.getByText("5 players")).toBeDefined();
  });

  it("renders '1 player' singular form", () => {
    render(<TeamCard team={BASE_TEAM} rosterCount={1} />);
    expect(screen.getByText("1 player")).toBeDefined();
  });

  it("renders as link when href provided", () => {
    render(<TeamCard team={BASE_TEAM} href="/cricket/teams/madison-strikers" />);
    const link = screen.getByRole("link");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/cricket/teams/madison-strikers");
  });

  it("does not render a link when no href provided", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows initials from short name when no logo", () => {
    render(<TeamCard team={BASE_TEAM} />);
    expect(screen.getByText("MDS")).toBeDefined();
  });

  it("shows 'Draft' badge for draft status", () => {
    render(<TeamCard team={{ ...BASE_TEAM, registrationStatus: "draft" }} />);
    expect(screen.getByText("Draft")).toBeDefined();
  });

  it("shows 'Submitted' badge for submitted status", () => {
    render(<TeamCard team={{ ...BASE_TEAM, registrationStatus: "submitted" }} />);
    expect(screen.getByText("Submitted")).toBeDefined();
  });
});
