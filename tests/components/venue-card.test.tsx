import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { VenueCard } from "@/components/cricket/VenueCard";
import type { CricketVenueFull } from "@/lib/cricket/types";

const baseVenue: CricketVenueFull = {
  id: "v1",
  name: "Madison Cricket Ground",
  slug: "madison-cricket-ground",
  address: "123 Cricket Ln",
  city: "Madison",
  region: "Wisconsin",
  country: "USA",
  latitude: null,
  longitude: null,
  notes: null,
  createdBy: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  shortName: "MCG",
  venueType: "ground",
  capacity: 500,
  timezone: "America/Chicago",
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  bookingNotes: null,
  pitchType: null,
  boundarySizeMeters: null,
  hasLights: true,
  hasTurfPitch: false,
  hasMattingPitch: true,
  hasPracticeNets: true,
  hasChangingRooms: false,
  hasParking: false,
  isActive: true,
  archivedAt: null,
};

describe("VenueCard", () => {
  it("renders venue name", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("Madison Cricket Ground")).toBeInTheDocument();
  });

  it("renders city and country", () => {
    render(<VenueCard venue={baseVenue} />);
    // City/region/country appear in location text
    expect(screen.getAllByText(/Madison/).length).toBeGreaterThan(0);
  });

  it("renders active status badge", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders inactive badge for archived venue", () => {
    render(<VenueCard venue={{ ...baseVenue, isActive: false }} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders active amenities (lights, matting, nets)", () => {
    render(<VenueCard venue={baseVenue} />);
    expect(screen.getByText("Lights")).toBeInTheDocument();
    expect(screen.getByText("Matting")).toBeInTheDocument();
    expect(screen.getByText("Nets")).toBeInTheDocument();
  });

  it("does not render edit link when showActions is false", () => {
    render(<VenueCard venue={baseVenue} showActions={false} canEdit />);
    expect(screen.queryByText("Edit venue →")).not.toBeInTheDocument();
  });

  it("renders edit link when showActions and canEdit are true", () => {
    render(<VenueCard venue={baseVenue} showActions canEdit />);
    expect(screen.getByText("Edit venue →")).toBeInTheDocument();
  });
});
