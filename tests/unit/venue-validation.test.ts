import { describe, it, expect } from "vitest";
import { createVenueSchema, generateVenueSlug, normalizeVenueSlug } from "@/lib/cricket/validation/venue";

describe("createVenueSchema", () => {
  const valid = {
    name: "Madison Cricket Ground",
    city: "Madison",
    country: "USA",
  };

  it("accepts a minimal valid venue", () => {
    const result = createVenueSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts a full valid venue", () => {
    const result = createVenueSchema.safeParse({
      ...valid,
      shortName: "MCG",
      venueType: "ground",
      address: "123 Cricket Ln",
      region: "Wisconsin",
      latitude: 43.073,
      longitude: -89.401,
      capacity: 1000,
      timezone: "America/Chicago",
      contactName: "John Smith",
      contactEmail: "john@example.com",
      contactPhone: "+1 555 000 0000",
      hasLights: true,
      hasTurfPitch: true,
      hasParking: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = createVenueSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 120 characters", () => {
    const result = createVenueSchema.safeParse({ ...valid, name: "A".repeat(121) });
    expect(result.success).toBe(false);
  });

  it("rejects latitude out of range", () => {
    const result = createVenueSchema.safeParse({ ...valid, latitude: 95 });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = createVenueSchema.safeParse({ ...valid, longitude: -200 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createVenueSchema.safeParse({ ...valid, contactEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for contactEmail (optional)", () => {
    const result = createVenueSchema.safeParse({ ...valid, contactEmail: "" });
    expect(result.success).toBe(true);
  });

  it("rejects negative capacity", () => {
    const result = createVenueSchema.safeParse({ ...valid, capacity: -1 });
    expect(result.success).toBe(false);
  });
});

describe("generateVenueSlug", () => {
  it("generates a slug from name", () => {
    const slug = generateVenueSlug("Madison Cricket Ground");
    expect(slug).toBe("madison-cricket-ground");
  });

  it("includes city in slug when provided", () => {
    const slug = generateVenueSlug("Central Park", "New York");
    expect(slug).toContain("central-park");
    expect(slug).toContain("new-york");
  });

  it("removes special characters", () => {
    const slug = generateVenueSlug("St. Mary's Ground & Club");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("truncates to 60 chars", () => {
    const slug = generateVenueSlug("A".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(60);
  });
});

describe("normalizeVenueSlug", () => {
  it("lowercases and removes invalid chars", () => {
    expect(normalizeVenueSlug("Hello World!")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeVenueSlug("abc---def")).toBe("abc-def");
  });

  it("trims leading/trailing hyphens", () => {
    expect(normalizeVenueSlug("-abc-")).toBe("abc");
  });
});
