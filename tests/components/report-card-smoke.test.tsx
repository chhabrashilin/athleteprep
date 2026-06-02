import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Smoke tests for report-related UI primitives.
 *
 * CoachingInsightCard and PlayerReportCard import next/link and are tested
 * at the E2E level instead to avoid mocking Next.js internals.
 * These tests cover the design-system building blocks those cards rely on.
 */

describe("Badge smoke test", () => {
  it("renders brand variant without crashing", () => {
    render(<Badge variant="brand">Mock AI</Badge>);
    expect(screen.getByText("Mock AI")).toBeDefined();
  });

  it("renders danger variant without crashing", () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText("Error")).toBeDefined();
  });

  it("renders muted variant without crashing", () => {
    render(<Badge variant="muted">Draft</Badge>);
    expect(screen.getByText("Draft")).toBeDefined();
  });
});

describe("EmptyState smoke test", () => {
  it("renders title without crashing", () => {
    render(
      <EmptyState
        title="No report yet"
        description="Generate a report to see insights here."
      />
    );
    expect(screen.getByText("No report yet")).toBeDefined();
  });

  it("renders description text", () => {
    render(
      <EmptyState
        title="No players"
        description="Add players to your roster to get started."
      />
    );
    expect(screen.getByText("Add players to your roster to get started.")).toBeDefined();
  });
});
