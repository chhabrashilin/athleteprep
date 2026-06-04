import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SportSelectionGrid } from "@/app/select-sport/SportSelectionGrid";
import type { SportEntry } from "@/lib/sports/registry";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server action — we just test the UI behavior
vi.mock("@/app/actions/sport-preferences", () => ({
  saveSportPreferenceAction: vi.fn().mockResolvedValue({ success: true }),
}));

const ENABLED_SPORTS: SportEntry[] = [
  {
    slug: "general",
    displayName: "General Sports",
    status: "enabled",
    tagline: "Existing GameIQ workflows.",
    icon: "⚡",
    supportedFeatureGroups: ["teams"],
  },
  {
    slug: "cricket",
    displayName: "Cricket",
    status: "enabled",
    tagline: "Cricket league management.",
    icon: "🏏",
    supportedFeatureGroups: ["leagues"],
  },
];

const COMING_SOON_SPORTS: SportEntry[] = [
  ...ENABLED_SPORTS,
  {
    slug: "baseball",
    displayName: "Baseball",
    status: "coming_soon",
    tagline: "Coming soon.",
    icon: "⚾",
    supportedFeatureGroups: ["teams"],
  },
];

describe("SportSelectionGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders all sport cards", () => {
    render(<SportSelectionGrid sports={ENABLED_SPORTS} />);
    expect(screen.getByText("General Sports")).toBeDefined();
    expect(screen.getByText("Cricket")).toBeDefined();
  });

  it("shows 'Available' badge for enabled sports", () => {
    render(<SportSelectionGrid sports={ENABLED_SPORTS} />);
    const badges = screen.getAllByText("Available");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Coming Soon' badge for coming_soon sports", () => {
    render(<SportSelectionGrid sports={COMING_SOON_SPORTS} />);
    expect(screen.getByText("Coming Soon")).toBeDefined();
  });

  it("disabled button is present for coming_soon sport", () => {
    render(<SportSelectionGrid sports={COMING_SOON_SPORTS} />);
    const baseballBtn = screen.getByRole("listitem", { name: /baseball — coming soon/i });
    expect(baseballBtn).toBeDefined();
  });

  it("stores selection in localStorage when an enabled sport is chosen", () => {
    render(<SportSelectionGrid sports={ENABLED_SPORTS} />);
    const cricketBtn = screen.getByRole("listitem", { name: /select cricket/i });
    fireEvent.click(cricketBtn);
    expect(localStorage.getItem("gameiq:selectedSport")).toBe("cricket");
  });

  it("navigates to /cricket when Cricket is selected", () => {
    render(<SportSelectionGrid sports={ENABLED_SPORTS} />);
    const cricketBtn = screen.getByRole("listitem", { name: /select cricket/i });
    fireEvent.click(cricketBtn);
    expect(mockPush).toHaveBeenCalledWith("/cricket");
  });

  it("navigates to /dashboard when General Sports is selected", () => {
    render(<SportSelectionGrid sports={ENABLED_SPORTS} />);
    const generalBtn = screen.getByRole("listitem", { name: /select general sports/i });
    fireEvent.click(generalBtn);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("does not navigate when coming_soon sport is clicked", () => {
    render(<SportSelectionGrid sports={COMING_SOON_SPORTS} />);
    const baseballBtn = screen.getByRole("listitem", { name: /baseball — coming soon/i });
    fireEvent.click(baseballBtn);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
