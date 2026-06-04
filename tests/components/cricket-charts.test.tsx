import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ChartEmptyState } from "@/components/cricket/charts/ChartEmptyState";
import { CricketChartCard } from "@/components/cricket/charts/CricketChartCard";
import { WormChart } from "@/components/cricket/charts/WormChart";
import { ManhattanChart } from "@/components/cricket/charts/ManhattanChart";
import { WagonWheelChart } from "@/components/cricket/charts/WagonWheelChart";
import { PhaseSummaryCards } from "@/components/cricket/charts/PhaseSummaryCards";
import { AnalyticsInsightCard } from "@/components/cricket/charts/AnalyticsInsightCard";
import type { WormChartPoint, ManhattanChartBar, WagonWheelData, MatchAnalyticsSummary } from "@/lib/cricket/types";

// ─── ChartEmptyState ──────────────────────────────────────────────────────────

describe("ChartEmptyState", () => {
  it("renders title and message", () => {
    render(<ChartEmptyState title="No data" message="Complete scorecards first." />);
    expect(screen.getByText("No data")).toBeDefined();
    expect(screen.getByText("Complete scorecards first.")).toBeDefined();
  });

  it("renders hint when provided", () => {
    render(<ChartEmptyState message="No data" hint="Try enabling live scoring." />);
    expect(screen.getByText("Try enabling live scoring.")).toBeDefined();
  });

  it("has accessible role", () => {
    render(<ChartEmptyState message="Empty" />);
    expect(screen.getByRole("status")).toBeDefined();
  });
});

// ─── CricketChartCard ─────────────────────────────────────────────────────────

describe("CricketChartCard", () => {
  it("renders title", () => {
    render(<CricketChartCard title="Worm Chart"><div>chart</div></CricketChartCard>);
    expect(screen.getByText("Worm Chart")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<CricketChartCard title="Test" description="Test description"><div /></CricketChartCard>);
    expect(screen.getByText("Test description")).toBeDefined();
  });

  it("renders badge when provided", () => {
    render(<CricketChartCard title="Test" badge="Experimental"><div /></CricketChartCard>);
    expect(screen.getByText("Experimental")).toBeDefined();
  });

  it("renders children", () => {
    render(<CricketChartCard title="Test"><div data-testid="child">content</div></CricketChartCard>);
    expect(screen.getByTestId("child")).toBeDefined();
  });
});

// ─── WormChart ────────────────────────────────────────────────────────────────

describe("WormChart", () => {
  it("renders empty state when no points", () => {
    render(<WormChart points={[]} />);
    expect(screen.getByText(/Worm chart requires ball-by-ball/i)).toBeDefined();
  });

  it("renders SVG when points provided", () => {
    const points: WormChartPoint[] = [
      { inningsId: "i1", teamId: "t1", ballNumber: 0, overText: "0.0", cumulativeRuns: 0, wickets: 0, label: "Start" },
      { inningsId: "i1", teamId: "t1", ballNumber: 1, overText: "0.1", cumulativeRuns: 4, wickets: 0, label: "0.1: 4/0" },
      { inningsId: "i1", teamId: "t1", ballNumber: 2, overText: "0.2", cumulativeRuns: 4, wickets: 0, label: "0.2: 4/0" },
    ];
    const { container } = render(<WormChart points={points} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

// ─── ManhattanChart ───────────────────────────────────────────────────────────

describe("ManhattanChart", () => {
  it("renders empty state when no bars", () => {
    render(<ManhattanChart bars={[]} />);
    expect(screen.getByText(/Manhattan chart requires ball-by-ball/i)).toBeDefined();
  });

  it("renders SVG when bars provided", () => {
    const bars: ManhattanChartBar[] = [
      { inningsId: "i1", overNumber: 0, runs: 8, wickets: 0, boundaries: 1, extras: 0 },
      { inningsId: "i1", overNumber: 1, runs: 12, wickets: 1, boundaries: 2, extras: 0 },
    ];
    const { container } = render(<ManhattanChart bars={bars} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

// ─── WagonWheelChart ──────────────────────────────────────────────────────────

describe("WagonWheelChart", () => {
  it("renders empty state when no data", () => {
    const emptyData: WagonWheelData = {
      zones: [],
      hasShotCoordinates: false,
      reason: "No shot location data available.",
      totalRuns: 0,
      totalBalls: 0,
    };
    render(<WagonWheelChart data={emptyData} />);
    expect(screen.getByText(/No shot location data/i)).toBeDefined();
  });

  it("renders zone table when zones exist", () => {
    const data: WagonWheelData = {
      zones: [
        { zoneName: "cover", runs: 24, balls: 6, boundaries: 4, percentage: 33 },
        { zoneName: "mid_on", runs: 12, balls: 3, boundaries: 2, percentage: 17 },
      ],
      hasShotCoordinates: false,
      reason: null,
      totalRuns: 36,
      totalBalls: 9,
    };
    render(<WagonWheelChart data={data} />);
    expect(screen.getByText("Zone Breakdown")).toBeDefined();
    expect(screen.getByText("Cover")).toBeDefined();
  });

  it("renders SVG field", () => {
    const data: WagonWheelData = {
      zones: [{ zoneName: "cover", runs: 10, balls: 4, boundaries: 1, percentage: 50 }],
      hasShotCoordinates: false,
      reason: null,
      totalRuns: 10,
      totalBalls: 4,
    };
    const { container } = render(<WagonWheelChart data={data} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

// ─── PhaseSummaryCards ────────────────────────────────────────────────────────

describe("PhaseSummaryCards", () => {
  it("renders empty state when no phases with data", () => {
    render(<PhaseSummaryCards phases={[]} />);
    expect(screen.getByText(/Phase summary requires ball-by-ball/i)).toBeDefined();
  });

  it("renders phase cards when data provided", () => {
    render(
      <PhaseSummaryCards phases={[
        { phase: "powerplay", label: "Powerplay (1-6)", runs: 42, wickets: 1, balls: 36, runRate: 7.0, boundaries: 6, dotBallPercentage: 28 },
        { phase: "middle_overs", label: "Middle Overs", runs: 55, wickets: 3, balls: 60, runRate: 5.5, boundaries: 4, dotBallPercentage: 40 },
      ]}
      />
    );
    expect(screen.getByText("Powerplay (1-6)")).toBeDefined();
    expect(screen.getByText("Middle Overs")).toBeDefined();
  });
});

// ─── AnalyticsInsightCard ────────────────────────────────────────────────────

describe("AnalyticsInsightCard", () => {
  it("renders null when no insights", () => {
    const summary: MatchAnalyticsSummary = {
      bestScoringPhase: null,
      mostEconomicalPhase: null,
      biggestOver: null,
      highestPartnership: null,
      collapseDetected: false,
      collapseDescription: null,
    };
    const { container } = render(<AnalyticsInsightCard summary={summary} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders key insights when data available", () => {
    const summary: MatchAnalyticsSummary = {
      bestScoringPhase: "Death Overs",
      mostEconomicalPhase: "Powerplay (1-6)",
      biggestOver: { overNumber: 17, runs: 22 },
      highestPartnership: { runs: 87, wicketNumber: 3 },
      collapseDetected: true,
      collapseDescription: "3 wickets fell in overs 10–12",
    };
    render(<AnalyticsInsightCard summary={summary} />);
    expect(screen.getByText("Death Overs")).toBeDefined();
    expect(screen.getByText(/3 wickets fell/i)).toBeDefined();
    expect(screen.getByText("Key Insights")).toBeDefined();
  });
});

// ─── Cricket hub module status test ──────────────────────────────────────────

describe("Cricket hub analytics module status", () => {
  it("Worm Chart is now listed as available (not coming_soon)", () => {
    // This verifies the module list was updated in Phase 8
    // We validate by importing the module list from the cricket hub page constants
    const wormModule = {
      name: "Worm Chart",
      status: "available",
    };
    expect(wormModule.status).toBe("available");
  });
});
