import { describe, it, expect } from "vitest";
import {
  classifyProductPolicyRisk,
  sanitizeProductDescription,
  sanitizeOrderPublicPayload,
  canShowPrice,
  getCommerceMode,
  generateOrderNumber,
  calculateCartSubtotal,
  isValidOrderStatusTransition,
  isValidKitRequestStatusTransition,
  getAllowedCricketProductCategories,
  getProhibitedCommerceCategories,
} from "@/lib/cricket/commerce/policy";

describe("getAllowedCricketProductCategories", () => {
  it("returns non-empty list", () => {
    const cats = getAllowedCricketProductCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats).toContain("bats");
    expect(cats).toContain("team_kits");
  });
});

describe("getProhibitedCommerceCategories", () => {
  it("contains gambling, alcohol, supplements, weapons", () => {
    const prohibited = getProhibitedCommerceCategories();
    expect(prohibited).toContain("gambling");
    expect(prohibited).toContain("alcohol");
    expect(prohibited).toContain("supplements");
    expect(prohibited).toContain("weapons");
    expect(prohibited).toContain("betting");
  });
});

describe("classifyProductPolicyRisk", () => {
  it("allows a normal cricket bat", () => {
    const result = classifyProductPolicyRisk({
      name: "English Willow Cricket Bat",
      description: "Grade 2 willow bat for club play",
      categorySlug: "bats",
    });
    expect(result.risk).toBe("allowed");
    expect(result.reasons).toHaveLength(0);
  });

  it("allows team jerseys", () => {
    const result = classifyProductPolicyRisk({
      name: "Team Jersey Package",
      categorySlug: "team_kits",
      product_type: "team_kit",
    });
    expect(result.risk).toBe("allowed");
  });

  it("prohibits alcohol", () => {
    const result = classifyProductPolicyRisk({ name: "Craft Beer Selection" });
    expect(result.risk).toBe("prohibited");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("prohibits gambling", () => {
    const result = classifyProductPolicyRisk({ name: "Cricket betting tips" });
    expect(result.risk).toBe("prohibited");
  });

  it("prohibits supplements", () => {
    const result = classifyProductPolicyRisk({ name: "Performance supplement pack" });
    expect(result.risk).toBe("prohibited");
  });

  it("prohibits weapons category slug", () => {
    const result = classifyProductPolicyRisk({
      name: "Sporting item",
      categorySlug: "weapons",
    });
    expect(result.risk).toBe("prohibited");
  });

  it("flags unknown category as needs_review", () => {
    const result = classifyProductPolicyRisk({
      name: "Some product",
      categorySlug: "unknown_category_xyz",
    });
    expect(result.risk).toBe("needs_review");
  });
});

describe("sanitizeProductDescription", () => {
  it("removes script tags", () => {
    const input = 'Hello <script>alert("xss")</script> world';
    const output = sanitizeProductDescription(input);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("alert");
    expect(output).toContain("Hello");
  });

  it("removes iframe tags", () => {
    const input = 'Text <iframe src="evil.com"></iframe> after';
    const output = sanitizeProductDescription(input);
    expect(output).not.toContain("iframe");
  });

  it("strips javascript: protocol", () => {
    const input = '<a href="javascript:evil()">click</a>';
    const output = sanitizeProductDescription(input);
    expect(output).not.toContain("javascript:");
  });

  it("leaves plain text intact", () => {
    const input = "High quality cricket bat — grade 2 English willow. Perfect for training.";
    const output = sanitizeProductDescription(input);
    expect(output).toBe(input);
  });
});

describe("sanitizeOrderPublicPayload", () => {
  it("removes private fields", () => {
    const order: Record<string, unknown> = {
      id: "order-1",
      order_number: "GIQ-ABC-DEF",
      order_type: "request",
      status: "submitted",
      payment_status: "not_required",
      fulfillment_status: "not_started",
      currency: "USD",
      subtotal_cents: 1000,
      tax_cents: 0,
      shipping_cents: 0,
      discount_cents: 0,
      total_cents: 1000,
      notes: "please ship quickly",
      submitted_at: "2025-01-01T00:00:00Z",
      confirmed_at: null,
      // private fields
      internal_notes: "SECRET - customer is VIP",
      customer_email: "buyer@example.com",
      customer_phone: "+15550000000",
      provider_checkout_id: "pi_xxx",
      provider_payment_intent_id: "pi_yyy",
    };

    const payload = sanitizeOrderPublicPayload(order);

    // Public fields present
    expect(payload.id).toBe("order-1");
    expect(payload.order_number).toBe("GIQ-ABC-DEF");
    expect(payload.notes).toBe("please ship quickly");

    // Private fields must not be in the result
    const p = payload as unknown as Record<string, unknown>;
    expect(p.internal_notes).toBeUndefined();
    expect(p.customer_email).toBeUndefined();
    expect(p.customer_phone).toBeUndefined();
    expect(p.provider_checkout_id).toBeUndefined();
    expect(p.provider_payment_intent_id).toBeUndefined();
  });
});

describe("canShowPrice", () => {
  it("returns false for quote_only product_type", () => {
    expect(canShowPrice({ product_type: "quote_only", price_cents: 1000 })).toBe(false);
  });

  it("returns false for quote_only inventory_status", () => {
    expect(canShowPrice({ price_cents: 500, inventory_status: "quote_only" })).toBe(false);
  });

  it("returns false when price_cents is null", () => {
    expect(canShowPrice({ price_cents: null })).toBe(false);
  });

  it("returns false when price_cents is undefined", () => {
    expect(canShowPrice({})).toBe(false);
  });

  it("returns true for a normal priced product", () => {
    expect(canShowPrice({ product_type: "physical", price_cents: 4999 })).toBe(true);
  });

  it("returns true for zero price", () => {
    expect(canShowPrice({ product_type: "physical", price_cents: 0 })).toBe(true);
  });
});

describe("generateOrderNumber", () => {
  it("returns a string starting with GIQ-", () => {
    const num = generateOrderNumber();
    expect(typeof num).toBe("string");
    expect(num.startsWith("GIQ-")).toBe(true);
  });

  it("generates unique numbers", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).not.toBe(b);
  });
});

describe("calculateCartSubtotal", () => {
  it("sums line totals correctly", () => {
    const items = [
      { quantity: 2, unit_price_cents: 1000 },
      { quantity: 1, unit_price_cents: 500 },
    ];
    expect(calculateCartSubtotal(items)).toBe(2500);
  });

  it("treats null price as 0", () => {
    const items = [
      { quantity: 3, unit_price_cents: null },
      { quantity: 1, unit_price_cents: 200 },
    ];
    expect(calculateCartSubtotal(items)).toBe(200);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateCartSubtotal([])).toBe(0);
  });
});

describe("isValidOrderStatusTransition", () => {
  it("allows submitted → reviewing", () => {
    expect(isValidOrderStatusTransition("submitted", "reviewing")).toBe(true);
  });

  it("allows submitted → cancelled", () => {
    expect(isValidOrderStatusTransition("submitted", "cancelled")).toBe(true);
  });

  it("blocks invalid transition", () => {
    expect(isValidOrderStatusTransition("completed", "submitted")).toBe(false);
  });

  it("blocks from archived to anything", () => {
    expect(isValidOrderStatusTransition("archived", "submitted")).toBe(false);
  });
});

describe("isValidKitRequestStatusTransition", () => {
  it("allows draft → submitted", () => {
    expect(isValidKitRequestStatusTransition("draft", "submitted")).toBe(true);
  });

  it("allows submitted → reviewing", () => {
    expect(isValidKitRequestStatusTransition("submitted", "reviewing")).toBe(true);
  });

  it("blocks delivered → any forward state", () => {
    expect(isValidKitRequestStatusTransition("delivered", "cancelled")).toBe(false);
  });
});

describe("getCommerceMode (env-based)", () => {
  it("returns request_only when CRICKET_PAYMENTS_ENABLED is not set", () => {
    const original = process.env.CRICKET_PAYMENTS_ENABLED;
    delete process.env.CRICKET_PAYMENTS_ENABLED;
    const mode = getCommerceMode();
    expect(mode).toBe("request_only");
    process.env.CRICKET_PAYMENTS_ENABLED = original;
  });
});
