import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge, VerificationBadge, Badge } from "@/components/ui/Badge";

describe("Badge (primitive)", () => {
  it("renders children", () => {
    render(<Badge>Test label</Badge>);
    expect(screen.getByText("Test label")).toBeDefined();
  });

  it("renders with success variant", () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText("Success")).toBeDefined();
  });
});

describe("ConfidenceBadge", () => {
  it("renders 'High Confidence' for level='high'", () => {
    render(<ConfidenceBadge level="high" />);
    expect(screen.getByText("High Confidence")).toBeDefined();
  });

  it("renders 'Medium Confidence' for level='medium'", () => {
    render(<ConfidenceBadge level="medium" />);
    expect(screen.getByText("Medium Confidence")).toBeDefined();
  });

  it("renders 'Low Confidence' for level='low'", () => {
    render(<ConfidenceBadge level="low" />);
    expect(screen.getByText("Low Confidence")).toBeDefined();
  });

  it("confidence label is accessible text (not just a visual element)", () => {
    render(<ConfidenceBadge level="high" />);
    // The text should be present and readable by screen readers
    const label = screen.getByText("High Confidence");
    expect(label).toBeDefined();
  });

  it("applies the className prop without crashing", () => {
    render(<ConfidenceBadge level="medium" className="custom-class" />);
    expect(screen.getByText("Medium Confidence")).toBeDefined();
  });
});

describe("VerificationBadge", () => {
  it("renders 'Unreviewed' for status='unreviewed'", () => {
    render(<VerificationBadge status="unreviewed" />);
    expect(screen.getByText("Unreviewed")).toBeDefined();
  });

  it("renders 'Accurate' for status='accurate'", () => {
    render(<VerificationBadge status="accurate" />);
    expect(screen.getByText("Accurate")).toBeDefined();
  });

  it("renders 'Partially Accurate' for status='partially_accurate'", () => {
    render(<VerificationBadge status="partially_accurate" />);
    expect(screen.getByText("Partially Accurate")).toBeDefined();
  });

  it("renders 'Inaccurate' for status='inaccurate'", () => {
    render(<VerificationBadge status="inaccurate" />);
    expect(screen.getByText("Inaccurate")).toBeDefined();
  });

  it("renders 'Edited' for status='edited'", () => {
    render(<VerificationBadge status="edited" />);
    expect(screen.getByText("Edited")).toBeDefined();
  });
});
