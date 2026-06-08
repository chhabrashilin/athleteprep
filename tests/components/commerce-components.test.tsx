import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ── CricketProductPrice ───────────────────────────────────────────────────────
import { CricketProductPrice } from "@/components/cricket/commerce/CricketProductPrice";

describe("CricketProductPrice", () => {
  it('shows "Request quote" for quote_only product_type', () => {
    render(<CricketProductPrice product={{ product_type: "quote_only" }} />);
    expect(screen.getByText(/request quote/i)).toBeDefined();
  });

  it('shows "Request quote" for quote_only inventory_status', () => {
    render(
      <CricketProductPrice
        product={{ price_cents: 1000, inventory_status: "quote_only" }}
      />
    );
    expect(screen.getByText(/request quote/i)).toBeDefined();
  });

  it('shows "Request quote" when price is null', () => {
    render(<CricketProductPrice product={{ price_cents: null }} />);
    expect(screen.getByText(/request quote/i)).toBeDefined();
  });

  it("renders formatted price for a priced product", () => {
    render(
      <CricketProductPrice
        product={{ product_type: "physical", price_cents: 4999, currency: "USD" }}
      />
    );
    expect(screen.getByText(/\$49/)).toBeDefined();
  });
});

// ── CricketOrderStatusBadge ───────────────────────────────────────────────────
import { CricketOrderStatusBadge } from "@/components/cricket/commerce/CricketOrderStatusBadge";

describe("CricketOrderStatusBadge", () => {
  it("renders submitted status", () => {
    render(<CricketOrderStatusBadge status="submitted" />);
    expect(screen.getByText("Submitted")).toBeDefined();
  });

  it("renders cancelled status", () => {
    render(<CricketOrderStatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeDefined();
  });

  it("renders unknown status gracefully", () => {
    render(<CricketOrderStatusBadge status="unknown_status" />);
    expect(screen.getByText("unknown_status")).toBeDefined();
  });
});

// ── CricketVendorStatusBadge ──────────────────────────────────────────────────
import { CricketVendorStatusBadge } from "@/components/cricket/commerce/CricketVendorStatusBadge";

describe("CricketVendorStatusBadge", () => {
  it("renders pending review", () => {
    render(<CricketVendorStatusBadge status="pending" />);
    expect(screen.getByText("Pending Review")).toBeDefined();
  });

  it("renders approved", () => {
    render(<CricketVendorStatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeDefined();
  });
});

// ── CricketProductApprovalBadge ───────────────────────────────────────────────
import { CricketProductApprovalBadge } from "@/components/cricket/commerce/CricketProductApprovalBadge";

describe("CricketProductApprovalBadge", () => {
  it("renders pending approval", () => {
    render(<CricketProductApprovalBadge status="pending" />);
    expect(screen.getByText("Pending Approval")).toBeDefined();
  });

  it("renders approved", () => {
    render(<CricketProductApprovalBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeDefined();
  });

  it("renders needs_changes", () => {
    render(<CricketProductApprovalBadge status="needs_changes" />);
    expect(screen.getByText("Needs Changes")).toBeDefined();
  });
});

// ── CommerceEmptyState ────────────────────────────────────────────────────────
import { CommerceEmptyState } from "@/components/cricket/commerce/CommerceEmptyState";

describe("CommerceEmptyState", () => {
  it("renders the title", () => {
    render(<CommerceEmptyState title="No products found" />);
    expect(screen.getByText("No products found")).toBeDefined();
  });

  it("renders the description when provided", () => {
    render(
      <CommerceEmptyState
        title="Empty"
        description="Nothing here yet."
      />
    );
    expect(screen.getByText("Nothing here yet.")).toBeDefined();
  });

  it("renders the custom icon", () => {
    render(<CommerceEmptyState title="Empty" icon="🏏" />);
    expect(screen.getByText("🏏")).toBeDefined();
  });
});

// ── CricketCheckoutModeNotice ─────────────────────────────────────────────────
import { CricketCheckoutModeNotice } from "@/components/cricket/commerce/CricketCheckoutModeNotice";

describe("CricketCheckoutModeNotice", () => {
  it("shows request-only copy in request_only mode", () => {
    render(<CricketCheckoutModeNotice mode="request_only" />);
    expect(screen.getByText(/Request-only mode/i)).toBeDefined();
  });

  it("shows provider not configured warning", () => {
    render(<CricketCheckoutModeNotice mode="provider_missing_config" />);
    expect(screen.getByText(/not fully configured/i)).toBeDefined();
  });

  it("shows checkout enabled copy in configured mode", () => {
    render(<CricketCheckoutModeNotice mode="checkout_provider_configured" />);
    expect(screen.getByText(/Secure checkout is enabled/i)).toBeDefined();
  });
});

// ── CommercePolicyWarning ─────────────────────────────────────────────────────
import { CommercePolicyWarning } from "@/components/cricket/commerce/CommercePolicyWarning";

describe("CommercePolicyWarning", () => {
  it("renders nothing for allowed product", () => {
    const { container } = render(
      <CommercePolicyWarning classification={{ risk: "allowed", reasons: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows prohibited warning", () => {
    render(
      <CommercePolicyWarning
        classification={{ risk: "prohibited", reasons: ["Contains alcohol keyword"] }}
      />
    );
    expect(screen.getByText(/not allowed/i)).toBeDefined();
    expect(screen.getByText("Contains alcohol keyword")).toBeDefined();
  });

  it("shows needs-review warning", () => {
    render(
      <CommercePolicyWarning
        classification={{ risk: "needs_review", reasons: ["Unknown category"] }}
      />
    );
    expect(screen.getByText(/requires review/i)).toBeDefined();
  });
});

// ── SponsorshipPackageCard ────────────────────────────────────────────────────
import { SponsorshipPackageCard } from "@/components/cricket/commerce/SponsorshipPackageCard";

const mockPackage = {
  id: "pkg-1",
  leagueId: "league-1",
  teamId: null,
  matchId: null,
  name: "Gold Sponsor",
  slug: "gold-sponsor",
  description: "Top tier sponsorship",
  packageType: "league",
  status: "active",
  visibility: "public",
  currency: "USD",
  priceCents: 25000,
  inventoryQuantity: null,
  benefits: ["Logo on jersey", "Social mention"],
  placementOptions: {},
  startDate: null,
  endDate: null,
  createdAt: "2025-01-01T00:00:00Z",
};

describe("SponsorshipPackageCard", () => {
  it("renders package name", () => {
    render(<SponsorshipPackageCard pkg={mockPackage} />);
    expect(screen.getByText("Gold Sponsor")).toBeDefined();
  });

  it("renders formatted price", () => {
    render(<SponsorshipPackageCard pkg={mockPackage} />);
    expect(screen.getByText(/\$250/)).toBeDefined();
  });

  it("renders benefits list", () => {
    render(<SponsorshipPackageCard pkg={mockPackage} />);
    expect(screen.getByText("Logo on jersey")).toBeDefined();
    expect(screen.getByText("Social mention")).toBeDefined();
  });

  it("renders Contact for pricing when price is null", () => {
    render(
      <SponsorshipPackageCard pkg={{ ...mockPackage, priceCents: null }} />
    );
    expect(screen.getByText(/contact for pricing/i)).toBeDefined();
  });

  it("renders inquiry button", () => {
    const onInquire = () => {};
    render(<SponsorshipPackageCard pkg={mockPackage} onInquire={onInquire} />);
    expect(screen.getByRole("button", { name: /inquire/i })).toBeDefined();
  });
});
