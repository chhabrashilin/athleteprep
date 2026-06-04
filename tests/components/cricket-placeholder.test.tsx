import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

// Mock AppShell to avoid needing full Next.js context in tests.
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("CricketPlaceholderPage", () => {
  it("renders the title", () => {
    render(
      <CricketPlaceholderPage
        title="Scorecards"
        description="Full innings scorecards."
        comingSoonDescription="Will be built when live scoring ships."
        status="coming_soon"
      />
    );
    expect(screen.getByText("Scorecards")).toBeDefined();
  });

  it("renders the description", () => {
    render(
      <CricketPlaceholderPage
        title="Scorecards"
        description="Full innings scorecards."
        comingSoonDescription="Will be built when live scoring ships."
        status="coming_soon"
      />
    );
    expect(screen.getByText("Full innings scorecards.")).toBeDefined();
  });

  it("renders 'Coming Soon' badge for coming_soon status", () => {
    render(
      <CricketPlaceholderPage
        title="Analytics"
        description="Advanced charts."
        comingSoonDescription="Wagon wheel and Manhattan graph."
        status="coming_soon"
      />
    );
    expect(screen.getByText("Coming Soon")).toBeDefined();
  });

  it("renders 'Foundation Ready' badge for foundation_ready status", () => {
    render(
      <CricketPlaceholderPage
        title="Leagues"
        description="Manage leagues."
        comingSoonDescription="Full workflow coming in Prompt 29."
        status="foundation_ready"
      />
    );
    expect(screen.getByText("Foundation Ready")).toBeDefined();
  });

  it("renders the back link to /cricket", () => {
    render(
      <CricketPlaceholderPage
        title="Leagues"
        description="Manage leagues."
        comingSoonDescription="Full workflow coming in Prompt 29."
        status="foundation_ready"
      />
    );
    const link = screen.getByRole("link");
    expect(link.textContent).toContain("Back to Cricket Hub");
  });

  it("shows feature flag notice when behindFlag is true", () => {
    render(
      <CricketPlaceholderPage
        title="Live Scoring"
        description="Ball-by-ball scoring."
        comingSoonDescription="Coming once flag is enabled."
        status="coming_soon"
        behindFlag={true}
        flagName="NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED"
      />
    );
    expect(screen.getByText("Feature flag disabled")).toBeDefined();
    expect(screen.getByText(/NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED/)).toBeDefined();
  });

  it("does not show flag notice when behindFlag is false", () => {
    render(
      <CricketPlaceholderPage
        title="Leagues"
        description="Manage leagues."
        comingSoonDescription="Coming soon."
        status="foundation_ready"
        behindFlag={false}
        flagName="NEXT_PUBLIC_CRICKET_ENABLED"
      />
    );
    expect(screen.queryByText("Feature flag disabled")).toBeNull();
  });
});
