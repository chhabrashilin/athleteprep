import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CricketModuleCard } from "@/components/cricket/CricketModuleCard";

describe("CricketModuleCard", () => {
  it("renders the module name", () => {
    render(
      <CricketModuleCard name="Leagues" description="Manage leagues." status="foundation_ready" />
    );
    expect(screen.getByText("Leagues")).toBeDefined();
  });

  it("renders the description", () => {
    render(
      <CricketModuleCard name="Leagues" description="Manage leagues." status="foundation_ready" />
    );
    expect(screen.getByText("Manage leagues.")).toBeDefined();
  });

  it("renders a status badge", () => {
    render(
      <CricketModuleCard name="Leagues" description="Manage leagues." status="foundation_ready" />
    );
    expect(screen.getByText("Foundation Ready")).toBeDefined();
  });

  it("renders an anchor tag when href is provided and status is not coming_soon", () => {
    render(
      <CricketModuleCard
        name="Teams"
        description="Manage teams."
        status="available"
        href="/teams"
      />
    );
    const link = screen.getByRole("link", { name: /teams/i });
    expect(link).toBeDefined();
  });

  it("does not render a link when status is coming_soon", () => {
    render(
      <CricketModuleCard
        name="Live Scoring"
        description="Ball-by-ball scoring."
        status="coming_soon"
        href="/cricket/live"
      />
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});
