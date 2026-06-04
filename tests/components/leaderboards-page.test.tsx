import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ─── Tab component ────────────────────────────────────────────────────────────

type Tab = "batting" | "bowling" | "fielding" | "allrounders" | "teams";

const TABS: { key: Tab; label: string }[] = [
  { key: "batting", label: "Batting" },
  { key: "bowling", label: "Bowling" },
  { key: "fielding", label: "Fielding" },
  { key: "allrounders", label: "All-rounders" },
  { key: "teams", label: "Team Stats" },
];

function LeaderboardTabs({ activeTab }: { activeTab: Tab }) {
  return (
    <nav data-testid="leaderboard-tabs">
      {TABS.map((t) => (
        <a
          key={t.key}
          href={`?tab=${t.key}`}
          data-testid={`tab-${t.key}`}
          aria-selected={activeTab === t.key}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}

// ─── Empty leaderboard state ──────────────────────────────────────────────────

function EmptyLeaderboard({ label }: { label: string }) {
  return (
    <div data-testid="empty-leaderboard">
      <p>No {label} data yet</p>
      <p>Complete scorecards and rebuild player stats to populate this leaderboard.</p>
    </div>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("LeaderboardTabs", () => {
  it("renders all 5 tabs", () => {
    render(<LeaderboardTabs activeTab="batting" />);
    expect(screen.getByTestId("tab-batting")).toBeDefined();
    expect(screen.getByTestId("tab-bowling")).toBeDefined();
    expect(screen.getByTestId("tab-fielding")).toBeDefined();
    expect(screen.getByTestId("tab-allrounders")).toBeDefined();
    expect(screen.getByTestId("tab-teams")).toBeDefined();
  });

  it("marks active tab with aria-selected", () => {
    render(<LeaderboardTabs activeTab="bowling" />);
    const bowlingTab = screen.getByTestId("tab-bowling");
    expect(bowlingTab.getAttribute("aria-selected")).toBe("true");
    const battingTab = screen.getByTestId("tab-batting");
    expect(battingTab.getAttribute("aria-selected")).toBe("false");
  });
});

describe("EmptyLeaderboard", () => {
  it("renders empty state for batting", () => {
    render(<EmptyLeaderboard label="batting" />);
    expect(screen.getByTestId("empty-leaderboard")).toBeDefined();
    expect(screen.getByText(/No batting data yet/i)).toBeDefined();
  });

  it("includes rebuild hint text", () => {
    render(<EmptyLeaderboard label="bowling" />);
    expect(screen.getByText(/Complete scorecards/i)).toBeDefined();
  });
});
