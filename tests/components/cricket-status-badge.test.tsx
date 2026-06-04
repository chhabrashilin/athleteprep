import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CricketStatusBadge } from "@/components/cricket/CricketStatusBadge";

describe("CricketStatusBadge", () => {
  it('renders "Available" for available status', () => {
    render(<CricketStatusBadge status="available" />);
    expect(screen.getByText("Available")).toBeDefined();
  });

  it('renders "Foundation Ready" for foundation_ready status', () => {
    render(<CricketStatusBadge status="foundation_ready" />);
    expect(screen.getByText("Foundation Ready")).toBeDefined();
  });

  it('renders "Coming Soon" for coming_soon status', () => {
    render(<CricketStatusBadge status="coming_soon" />);
    expect(screen.getByText("Coming Soon")).toBeDefined();
  });

  it("sets an aria-label describing the status", () => {
    render(<CricketStatusBadge status="available" />);
    expect(screen.getByLabelText("Status: Available")).toBeDefined();
  });
});
