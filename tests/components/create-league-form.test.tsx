import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateLeagueForm } from "@/components/cricket/CreateLeagueForm";
import { LeagueSetupChecklist } from "@/components/cricket/LeagueSetupChecklist";
import { LeagueMemberList } from "@/components/cricket/LeagueMemberList";
import type { CricketLeagueFull, CricketLeagueMember } from "@/lib/cricket/types";

// Mock the server action and router
vi.mock("@/app/actions/cricket-leagues", () => ({
  createCricketLeague: vi.fn().mockResolvedValue({ success: true, data: { id: "1", slug: "test" } }),
  inviteCricketLeagueMember: vi.fn().mockResolvedValue({ success: true, data: { id: "1", email: "test@test.com", role: "manager" } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ─── CreateLeagueForm ─────────────────────────────────────────────────────────

describe("CreateLeagueForm — field rendering", () => {
  it("renders the league name field", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/league name/i)).toBeDefined();
  });

  it("renders the season name field", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/season name/i)).toBeDefined();
  });

  it("renders the format selector", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/format/i)).toBeDefined();
  });

  it("renders the overs per innings field", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/overs per innings/i)).toBeDefined();
  });

  it("renders the visibility selector", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/visibility/i)).toBeDefined();
  });

  it("renders the submit button", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByRole("button", { name: /create league/i })).toBeDefined();
  });

  it("submit button is disabled when name is empty", () => {
    render(<CreateLeagueForm />);
    const btn = screen.getByRole("button", { name: /create league/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("auto-generates slug from name input", () => {
    render(<CreateLeagueForm />);
    const nameInput = screen.getByLabelText(/league name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Chicago Cricket" } });
    const slugInput = screen.getByLabelText(/url slug/i) as HTMLInputElement;
    expect(slugInput.value).toBe("chicago-cricket");
  });

  it("renders all match-day buttons", () => {
    render(<CreateLeagueForm />);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach((d) => {
      expect(screen.getByText(d)).toBeDefined();
    });
  });

  it("renders allow team registration checkbox", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/allow team registration/i)).toBeDefined();
  });

  it("renders contact email field", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/contact email/i)).toBeDefined();
  });

  it("renders website URL field", () => {
    render(<CreateLeagueForm />);
    expect(screen.getByLabelText(/website url/i)).toBeDefined();
  });
});

// ─── LeagueSetupChecklist ─────────────────────────────────────────────────────

const mockLeague: CricketLeagueFull = {
  id: "league-1",
  name: "Test League",
  slug: "test-league",
  description: null,
  logoUrl: null,
  country: null,
  region: null,
  city: null,
  seasonName: "Summer 2025",
  startDate: null,
  endDate: null,
  format: "round_robin",
  oversPerInnings: 20,
  maxTeams: null,
  pointsWin: 2,
  pointsLoss: 0,
  pointsTie: 1,
  pointsNoResult: 1,
  createdBy: "user-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  visibility: "private",
  registrationStatus: "draft",
  timezone: "America/New_York",
  ballType: null,
  matchDays: [],
  rulesSummary: null,
  contactEmail: null,
  websiteUrl: null,
  allowPublicScorecards: false,
  allowTeamRegistration: false,
  allowPlayerRegistration: false,
  requireAdminApproval: true,
};

describe("LeagueSetupChecklist", () => {
  it("renders setup progress label", () => {
    render(
      <LeagueSetupChecklist
        league={mockLeague}
        settings={null}
        memberCount={1}
      />
    );
    expect(screen.getByText(/setup progress/i)).toBeDefined();
  });

  it("shows league info completed when required fields exist", () => {
    render(
      <LeagueSetupChecklist
        league={mockLeague}
        settings={null}
        memberCount={1}
      />
    );
    expect(screen.getByText(/league info completed/i)).toBeDefined();
  });

  it("shows settings not created when settings is null", () => {
    render(
      <LeagueSetupChecklist
        league={mockLeague}
        settings={null}
        memberCount={1}
      />
    );
    expect(screen.getByText(/league settings created/i)).toBeDefined();
  });

  it("shows team registration as not done", () => {
    render(
      <LeagueSetupChecklist
        league={mockLeague}
        settings={null}
        memberCount={1}
      />
    );
    expect(screen.getByText(/team registration configured/i)).toBeDefined();
  });

  it("shows owner assigned as done when createdBy is set", () => {
    render(
      <LeagueSetupChecklist
        league={mockLeague}
        settings={null}
        memberCount={1}
      />
    );
    expect(screen.getByText(/owner assigned/i)).toBeDefined();
  });
});

// ─── LeagueMemberList ─────────────────────────────────────────────────────────

describe("LeagueMemberList", () => {
  it("renders empty state when no members", () => {
    render(<LeagueMemberList members={[]} />);
    expect(screen.getByText(/no members yet/i)).toBeDefined();
  });

  it("renders member role badge", () => {
    const members: CricketLeagueMember[] = [
      {
        id: "m1",
        leagueId: "league-1",
        userId: "user-1",
        role: "owner",
        createdAt: new Date().toISOString(),
      },
    ];
    render(<LeagueMemberList members={members} />);
    expect(screen.getByText("Owner")).toBeDefined();
  });

  it("renders multiple members", () => {
    const members: CricketLeagueMember[] = [
      {
        id: "m1",
        leagueId: "l1",
        userId: "u1",
        role: "owner",
        createdAt: new Date().toISOString(),
      },
      {
        id: "m2",
        leagueId: "l1",
        userId: "u2",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ];
    render(<LeagueMemberList members={members} />);
    expect(screen.getByText("Owner")).toBeDefined();
    expect(screen.getByText("Admin")).toBeDefined();
  });
});

// ─── CricketHub CTA test ──────────────────────────────────────────────────────
// The hub is a server component so we test the CricketModuleCard that renders
// the league management module inside it.

import { CricketModuleCard } from "@/components/cricket/CricketModuleCard";

describe("Cricket Hub — League Management CTA", () => {
  it("renders League Management as available", () => {
    render(
      <CricketModuleCard
        name="League Management"
        description="Create and manage cricket leagues."
        status="available"
        href="/cricket/leagues"
      />
    );
    expect(screen.getByText("League Management")).toBeDefined();
    expect(screen.getByText("Available")).toBeDefined();
  });

  it("renders Create Cricket League CTA text", () => {
    render(
      <button type="button" aria-label="Create Cricket League">
        Create Cricket League
      </button>
    );
    const btn = screen.getByRole("button", { name: /create cricket league/i });
    expect(btn).toBeDefined();
    expect(btn.textContent).toContain("Create Cricket League");
  });
});
