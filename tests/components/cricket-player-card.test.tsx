import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerCard } from "@/components/cricket/PlayerCard";
import type { CricketPlayerFull, CricketRosterEntry } from "@/lib/cricket/types";

const BASE_PLAYER: CricketPlayerFull = {
  id: "c1000000-0000-0000-0000-000000000001",
  userId: null,
  displayName: "Aarav Singh",
  slug: "aarav-singh",
  battingStyle: "right_hand_bat",
  bowlingStyle: "right_arm_medium",
  role: "All-rounder",
  profilePhotoUrl: null,
  bio: null,
  dateOfBirth: null,
  country: "United States",
  city: "Madison",
  createdBy: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  email: null,
  phone: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  gender: null,
  dominantHand: null,
  primaryRole: "all_rounder",
  secondaryRole: null,
  battingOrderPreference: null,
  bowlingType: null,
  fieldingPositionPreference: null,
  availabilityStatus: "active",
  isVerified: false,
};

const BASE_ROSTER_ENTRY: CricketRosterEntry = {
  id: "r1",
  cricketTeamId: "b1000000-0000-0000-0000-000000000001",
  cricketPlayerId: "c1000000-0000-0000-0000-000000000001",
  jerseyNumber: "7",
  rosterRole: "all_rounder",
  isCaptain: false,
  isViceCaptain: false,
  joinedAt: "2026-01-01T00:00:00Z",
};

describe("PlayerCard", () => {
  it("renders display name", () => {
    render(<PlayerCard player={BASE_PLAYER} />);
    expect(screen.getByText("Aarav Singh")).toBeDefined();
  });

  it("renders primary role label", () => {
    render(<PlayerCard player={BASE_PLAYER} />);
    expect(screen.getByText("All-rounder")).toBeDefined();
  });

  it("renders jersey number when roster entry provided", () => {
    render(<PlayerCard player={BASE_PLAYER} rosterEntry={BASE_ROSTER_ENTRY} />);
    expect(screen.getByText("#7")).toBeDefined();
  });

  it("shows 'C' badge when is captain", () => {
    render(<PlayerCard player={BASE_PLAYER} rosterEntry={{ ...BASE_ROSTER_ENTRY, isCaptain: true }} />);
    expect(screen.getByText("C")).toBeDefined();
  });

  it("shows 'VC' badge when is vice captain", () => {
    render(<PlayerCard player={BASE_PLAYER} rosterEntry={{ ...BASE_ROSTER_ENTRY, isViceCaptain: true }} />);
    expect(screen.getByText("VC")).toBeDefined();
  });

  it("shows 'Linked' badge when player has userId", () => {
    render(<PlayerCard player={{ ...BASE_PLAYER, userId: "u1" }} />);
    expect(screen.getByText("Linked")).toBeDefined();
  });

  it("renders as link when href provided and canManage is false", () => {
    render(<PlayerCard player={BASE_PLAYER} href="/cricket/players/aarav-singh" canManage={false} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/cricket/players/aarav-singh");
  });

  it("shows batting style abbreviation", () => {
    render(<PlayerCard player={BASE_PLAYER} />);
    expect(screen.getByText(/Bat: RHB/)).toBeDefined();
  });

  it("shows bowling style abbreviation", () => {
    render(<PlayerCard player={BASE_PLAYER} />);
    expect(screen.getByText(/Bowl: RAM/)).toBeDefined();
  });

  it("renders initials when no photo", () => {
    render(<PlayerCard player={BASE_PLAYER} />);
    expect(screen.getByText("AS")).toBeDefined();
  });

  it("does not render manage buttons when canManage is false", () => {
    render(<PlayerCard player={BASE_PLAYER} canManage={false} onRemove={() => {}} />);
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("renders manage buttons when canManage is true", () => {
    render(<PlayerCard player={BASE_PLAYER} canManage={true} onRemove={() => {}} />);
    expect(screen.getByText("Remove")).toBeDefined();
  });
});
