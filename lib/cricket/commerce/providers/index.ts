/**
 * lib/cricket/commerce/providers/index.ts
 * Provider factory — returns the active CheckoutProvider based on env config.
 * Defaults to request_only (always safe).
 */

import type { CheckoutProvider } from "./types";
import { RequestOnlyProvider } from "./request-only";
import { StripeProvider } from "./stripe";

let _provider: CheckoutProvider | null = null;

export function getCheckoutProvider(): CheckoutProvider {
  if (_provider) return _provider;

  const providerKey = process.env.CRICKET_CHECKOUT_PROVIDER ?? "request_only";
  const paymentsEnabled = process.env.CRICKET_PAYMENTS_ENABLED === "true";

  if (paymentsEnabled && providerKey === "stripe") {
    const stripe = new StripeProvider();
    if (stripe.isConfigured()) {
      _provider = stripe;
      return _provider;
    }
    // Fall through to request_only if Stripe is not fully configured
  }

  _provider = new RequestOnlyProvider();
  return _provider;
}

// Reset the cached provider (useful in tests)
export function resetCheckoutProvider(): void {
  _provider = null;
}

export type { CheckoutProvider, CheckoutOrder, CheckoutSessionResult } from "./types";
