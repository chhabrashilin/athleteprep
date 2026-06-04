import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CricketModuleCard } from "@/components/cricket/CricketModuleCard";
import { CricketStatusBadge } from "@/components/cricket/CricketStatusBadge";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";

// ─── CricketModuleCard ────────────────────────────────────────────────────────

describe("CricketModuleCard — hub rendering", () => {
  it("renders the hero name", () => {
    render(<CricketModuleCard name="Cricket Hub" description="Hub desc." status="available" />);
    expect(screen.getByText("Cricket Hub")).toBeDefined();
  });

  it("renders 'Available' badge for available modules", () => {
    render(<CricketModuleCard name="Teams" description="Manage teams." status="available" href="/teams" />);
    expect(screen.getByText("Available")).toBeDefined();
  });

  it("renders 'Foundation Ready' badge", () => {
    render(<CricketModuleCard name="Leagues" description="Manage leagues." status="foundation_ready" />);
    expect(screen.getByText("Foundation Ready")).toBeDefined();
  });

  it("renders 'Coming Soon' badge for disabled modules", () => {
    render(<CricketModuleCard name="Live Scoring" description="Ball-by-ball." status="coming_soon" />);
    expect(screen.getByText("Coming Soon")).toBeDefined();
  });

  it("does not render a link for coming_soon modules", () => {
    render(<CricketModuleCard name="Analytics" description="Charts." status="coming_soon" href="/cricket/analytics" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a link for foundation_ready module with href", () => {
    render(<CricketModuleCard name="Leagues" description="Leagues." status="foundation_ready" href="/cricket/leagues" />);
    expect(screen.getByRole("link")).toBeDefined();
  });
});

// ─── CricketStatusBadge ───────────────────────────────────────────────────────

describe("CricketStatusBadge", () => {
  it("renders 'Available' text for available status", () => {
    render(<CricketStatusBadge status="available" />);
    expect(screen.getByText("Available")).toBeDefined();
  });

  it("renders 'Foundation Ready' for foundation_ready", () => {
    render(<CricketStatusBadge status="foundation_ready" />);
    expect(screen.getByText("Foundation Ready")).toBeDefined();
  });

  it("renders 'Coming Soon' for coming_soon", () => {
    render(<CricketStatusBadge status="coming_soon" />);
    expect(screen.getByText("Coming Soon")).toBeDefined();
  });

  it("has an accessible aria-label", () => {
    render(<CricketStatusBadge status="available" />);
    const badge = screen.getByText("Available");
    expect(badge.getAttribute("aria-label")).toBe("Status: Available");
  });
});

// ─── CricketEmptyState ────────────────────────────────────────────────────────

describe("CricketEmptyState", () => {
  it("renders the title", () => {
    render(<CricketEmptyState title="Coming soon" description="We are building this." />);
    expect(screen.getByText("Coming soon")).toBeDefined();
  });

  it("renders the description", () => {
    render(<CricketEmptyState title="Coming soon" description="We are building this." />);
    expect(screen.getByText("We are building this.")).toBeDefined();
  });

  it("renders a back link when backHref is provided", () => {
    render(
      <CricketEmptyState
        title="Coming soon"
        description="Building."
        backHref="/cricket"
        backLabel="Back to Cricket Hub"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toBeDefined();
    expect(link.textContent).toContain("Back to Cricket Hub");
  });

  it("does not render a link when backHref is omitted", () => {
    render(<CricketEmptyState title="Coming soon" description="Building." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
