import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RequestOnlyProvider } from "@/lib/cricket/commerce/providers/request-only";
import { StripeProvider } from "@/lib/cricket/commerce/providers/stripe";
import { resetCheckoutProvider, getCheckoutProvider } from "@/lib/cricket/commerce/providers";

const mockOrder = {
  id: "order-123",
  order_number: "GIQ-TEST-001",
  currency: "USD",
  total_cents: 4999,
  customer_name: "Jane Smith",
  customer_email: "jane@example.com",
  items: [{ product_name: "Cricket Bat", quantity: 1, unit_price_cents: 4999 }],
};

// ── RequestOnlyProvider ───────────────────────────────────────────────────────

describe("RequestOnlyProvider", () => {
  const provider = new RequestOnlyProvider();

  it("is always configured", () => {
    expect(provider.isConfigured()).toBe(true);
  });

  it("providerKey is request_only", () => {
    expect(provider.providerKey).toBe("request_only");
  });

  it("getProviderStatus returns configured", () => {
    const status = provider.getProviderStatus();
    expect(status.status).toBe("configured");
  });

  it("createCheckoutSession returns success with order URL", async () => {
    const result = await provider.createCheckoutSession(mockOrder);
    expect(result.success).toBe(true);
    expect(result.mode).toBe("request_only");
    expect(result.session_url).toContain(mockOrder.id);
  });

  it("verifyWebhook returns null (no webhooks for request_only)", async () => {
    const result = await provider.verifyWebhook("payload", "sig");
    expect(result).toBeNull();
  });

  it("refundPayment returns failure (no payment taken)", async () => {
    const result = await provider.refundPayment(mockOrder);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("does not accept raw card data fields in order", async () => {
    // The order interface has no card_number, cvv, expiry fields
    const result = await provider.createCheckoutSession(mockOrder);
    const sessionKeys = Object.keys(result);
    expect(sessionKeys).not.toContain("card_number");
    expect(sessionKeys).not.toContain("cvv");
    expect(sessionKeys).not.toContain("expiry");
  });
});

// ── StripeProvider ────────────────────────────────────────────────────────────

describe("StripeProvider", () => {
  const stripe = new StripeProvider();

  beforeEach(() => {
    // Ensure Stripe keys are absent
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    process.env.CRICKET_PAYMENTS_ENABLED = "false";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.CRICKET_PAYMENTS_ENABLED;
  });

  it("is NOT configured when keys are missing", () => {
    expect(stripe.isConfigured()).toBe(false);
  });

  it("returns disabled status when CRICKET_PAYMENTS_ENABLED=false", () => {
    const status = stripe.getProviderStatus();
    expect(status.status).toBe("disabled");
  });

  it("returns not_configured when payments enabled but keys missing", () => {
    process.env.CRICKET_PAYMENTS_ENABLED = "true";
    const s = new StripeProvider();
    const status = s.getProviderStatus();
    expect(status.status).toBe("not_configured");
  });

  it("createCheckoutSession returns provider_not_configured when unconfigured", async () => {
    const result = await stripe.createCheckoutSession(mockOrder);
    expect(result.success).toBe(false);
    expect(result.mode).toBe("provider_not_configured");
    expect(result.error).toBeTruthy();
  });

  it("verifyWebhook returns null when not configured", async () => {
    const result = await stripe.verifyWebhook("payload", "sig");
    expect(result).toBeNull();
  });
});

// ── getCheckoutProvider factory ───────────────────────────────────────────────

describe("getCheckoutProvider", () => {
  beforeEach(() => {
    resetCheckoutProvider();
    delete process.env.CRICKET_CHECKOUT_PROVIDER;
    delete process.env.CRICKET_PAYMENTS_ENABLED;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  afterEach(() => {
    resetCheckoutProvider();
  });

  it("defaults to request_only when no config", () => {
    const provider = getCheckoutProvider();
    expect(provider.providerKey).toBe("request_only");
  });

  it("returns request_only when CRICKET_PAYMENTS_ENABLED=false", () => {
    process.env.CRICKET_PAYMENTS_ENABLED = "false";
    process.env.CRICKET_CHECKOUT_PROVIDER = "stripe";
    const provider = getCheckoutProvider();
    expect(provider.providerKey).toBe("request_only");
  });

  it("falls back to request_only when stripe provider lacks keys", () => {
    process.env.CRICKET_PAYMENTS_ENABLED = "true";
    process.env.CRICKET_CHECKOUT_PROVIDER = "stripe";
    // No Stripe keys set → falls back to request_only
    const provider = getCheckoutProvider();
    expect(provider.providerKey).toBe("request_only");
  });
});
