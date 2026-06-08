import { describe, it, expect } from "vitest";
import { createVendorSchema, createProductSchema } from "@/lib/cricket/validation/vendors";
import { cartItemSchema, orderRequestSchema } from "@/lib/cricket/validation/commerce";
import { createTeamKitRequestSchema } from "@/lib/cricket/validation/team-kit";
import {
  createSponsorshipPackageSchema,
  createSponsorshipInquirySchema,
} from "@/lib/cricket/validation/sponsorship";

// ── Vendor schema ─────────────────────────────────────────────────────────────

describe("createVendorSchema", () => {
  const valid = {
    name: "Madison Cricket Supplies",
    slug: "madison-cricket-supplies",
    contact_name: "Sam Patel",
    contact_email: "sam@example.com",
    vendor_type: "equipment",
  };

  it("accepts valid vendor input", () => {
    expect(createVendorSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const r = createVendorSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = createVendorSchema.safeParse({ ...valid, contact_email: "not-email" });
    expect(r.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const r = createVendorSchema.safeParse({ ...valid, slug: "my slug" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid URL for website_url", () => {
    const r = createVendorSchema.safeParse({ ...valid, website_url: "not-a-url" });
    expect(r.success).toBe(false);
  });

  it("accepts empty string for website_url", () => {
    const r = createVendorSchema.safeParse({ ...valid, website_url: "" });
    expect(r.success).toBe(true);
  });
});

// ── Product schema ────────────────────────────────────────────────────────────

describe("createProductSchema", () => {
  const valid = {
    vendor_id: "00000000-0000-0000-0000-000000000000",
    name: "English Willow Bat",
    slug: "english-willow-bat",
    product_type: "physical",
    currency: "USD",
    min_order_quantity: 1,
    image_urls: [],
    tags: [],
  };

  it("accepts valid product", () => {
    expect(createProductSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative price", () => {
    const r = createProductSchema.safeParse({ ...valid, price_cents: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects max_order_quantity less than min", () => {
    const r = createProductSchema.safeParse({
      ...valid,
      min_order_quantity: 5,
      max_order_quantity: 3,
    });
    expect(r.success).toBe(false);
  });

  it("rejects prohibited product name (alcohol)", () => {
    const r = createProductSchema.safeParse({ ...valid, name: "Cricket Beer Sponsor Kit" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid currency code", () => {
    const r = createProductSchema.safeParse({ ...valid, currency: "usd" });
    expect(r.success).toBe(false);
  });

  it("rejects more than 8 image URLs", () => {
    const r = createProductSchema.safeParse({
      ...valid,
      image_urls: Array(9).fill("https://example.com/img.jpg"),
    });
    expect(r.success).toBe(false);
  });
});

// ── Cart item schema ──────────────────────────────────────────────────────────

describe("cartItemSchema", () => {
  const valid = {
    product_id: "00000000-0000-0000-0000-000000000000",
    quantity: 2,
  };

  it("accepts valid cart item", () => {
    expect(cartItemSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects quantity 0", () => {
    expect(cartItemSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
  });

  it("rejects quantity > 999", () => {
    expect(cartItemSchema.safeParse({ ...valid, quantity: 1000 }).success).toBe(false);
  });

  it("accepts optional variant_id", () => {
    const r = cartItemSchema.safeParse({
      ...valid,
      variant_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    });
    expect(r.success).toBe(true);
  });
});

// ── Order request schema ──────────────────────────────────────────────────────

describe("orderRequestSchema", () => {
  const valid = {
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    items: [],
  };

  it("accepts valid order request", () => {
    expect(orderRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = orderRequestSchema.safeParse({ ...valid, customer_email: "bad" });
    expect(r.success).toBe(false);
  });

  it("rejects notes exceeding 2000 chars", () => {
    const r = orderRequestSchema.safeParse({ ...valid, notes: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });
});

// ── Team kit request schema ───────────────────────────────────────────────────

describe("createTeamKitRequestSchema", () => {
  const valid = {
    team_id: "00000000-0000-0000-0000-000000000000",
    kit_type: "full_team_kit",
    currency: "USD",
  };

  it("accepts valid kit request", () => {
    expect(createTeamKitRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative budget", () => {
    const r = createTeamKitRequestSchema.safeParse({ ...valid, budget_cents: -100 });
    expect(r.success).toBe(false);
  });

  it("rejects past delivery deadline", () => {
    const r = createTeamKitRequestSchema.safeParse({
      ...valid,
      delivery_deadline: "2000-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a future delivery deadline", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const r = createTeamKitRequestSchema.safeParse({
      ...valid,
      delivery_deadline: future.toISOString().split("T")[0],
    });
    expect(r.success).toBe(true);
  });
});

// ── Sponsorship package schema ────────────────────────────────────────────────

describe("createSponsorshipPackageSchema", () => {
  const valid = {
    league_id: "00000000-0000-0000-0000-000000000000",
    name: "Gold Sponsor 2025",
    slug: "gold-sponsor-2025",
    package_type: "league",
    currency: "USD",
    benefits: [],
    placement_options: {},
  };

  it("accepts valid package", () => {
    expect(createSponsorshipPackageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid date range", () => {
    const r = createSponsorshipPackageSchema.safeParse({
      ...valid,
      start_date: "2025-12-01",
      end_date: "2025-01-01",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid date range", () => {
    const r = createSponsorshipPackageSchema.safeParse({
      ...valid,
      start_date: "2025-01-01",
      end_date: "2025-12-31",
    });
    expect(r.success).toBe(true);
  });
});

// ── Sponsorship inquiry schema ────────────────────────────────────────────────

describe("createSponsorshipInquirySchema", () => {
  const valid = {
    league_id: "00000000-0000-0000-0000-000000000000",
    company_name: "Acme Corp",
    contact_name: "John Doe",
    contact_email: "john@acme.example",
  };

  it("accepts valid inquiry", () => {
    expect(createSponsorshipInquirySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = createSponsorshipInquirySchema.safeParse({ ...valid, contact_email: "bad" });
    expect(r.success).toBe(false);
  });

  it("rejects message exceeding 2000 chars", () => {
    const r = createSponsorshipInquirySchema.safeParse({
      ...valid,
      message: "x".repeat(2001),
    });
    expect(r.success).toBe(false);
  });
});
