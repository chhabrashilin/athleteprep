/**
 * lib/cricket/commerce/providers/stripe.ts
 * Stripe checkout provider stub.
 *
 * Only active when ALL of these are true:
 *   1. CRICKET_PAYMENTS_ENABLED=true
 *   2. STRIPE_SECRET_KEY is set (server-side only — never NEXT_PUBLIC_)
 *   3. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
 *
 * This implementation uses redirect-only Checkout Sessions.
 * Raw card data is NEVER collected by GameIQ directly.
 *
 * Stripe SDK is intentionally loaded dynamically to avoid import errors
 * when the package is not installed.
 */

import type {
  CheckoutProvider,
  CheckoutOrder,
  CheckoutSessionResult,
  RefundResult,
  ProviderStatusResult,
} from "./types";

export class StripeProvider implements CheckoutProvider {
  readonly providerKey = "stripe";

  private get secretKey(): string | undefined {
    return process.env.STRIPE_SECRET_KEY;
  }

  private get publishableKey(): string | undefined {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }

  private get webhookSecret(): string | undefined {
    return process.env.STRIPE_WEBHOOK_SECRET;
  }

  private get paymentsEnabled(): boolean {
    return process.env.CRICKET_PAYMENTS_ENABLED === "true";
  }

  isConfigured(): boolean {
    return (
      this.paymentsEnabled &&
      Boolean(this.secretKey) &&
      Boolean(this.publishableKey)
    );
  }

  getProviderStatus(): ProviderStatusResult {
    if (!this.paymentsEnabled) {
      return {
        provider: this.providerKey,
        status: "disabled",
        message:
          "Stripe is disabled. Set CRICKET_PAYMENTS_ENABLED=true to enable.",
      };
    }
    if (!this.secretKey || !this.publishableKey) {
      return {
        provider: this.providerKey,
        status: "not_configured",
        message:
          "Stripe keys missing. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      };
    }
    return {
      provider: this.providerKey,
      status: "configured",
      message: "Stripe Checkout is configured.",
    };
  }

  async createCheckoutSession(
    order: CheckoutOrder
  ): Promise<CheckoutSessionResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        mode: "provider_not_configured",
        error:
          "Checkout provider is not configured. Use request-only mode.",
      };
    }

    try {
      // Dynamic import avoids hard dependency on stripe package.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require("stripe");
      const stripe = new Stripe(this.secretKey!, { apiVersion: "2024-06-20" });

      const lineItems = order.items
        .filter((item) => item.unit_price_cents != null && item.unit_price_cents > 0)
        .map((item) => ({
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: { name: item.product_name },
            unit_amount: item.unit_price_cents!,
          },
          quantity: item.quantity,
        }));

      if (!lineItems.length) {
        return {
          success: false,
          mode: "stripe",
          error:
            "No priced items in order. Use request-only mode for quote-only products.",
        };
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        customer_email: order.customer_email ?? undefined,
        success_url: `${appUrl}/cricket/store/orders/${order.id}?payment=success`,
        cancel_url: `${appUrl}/cricket/store/checkout?cancelled=1`,
        metadata: {
          gameiq_order_id: order.id,
          gameiq_order_number: order.order_number,
        },
      });

      return {
        success: true,
        session_url: session.url,
        provider_checkout_id: session.id,
        mode: "stripe",
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Stripe error";
      return {
        success: false,
        mode: "stripe",
        error: `Stripe checkout failed: ${message}`,
      };
    }
  }

  async verifyWebhook(
    payload: string,
    signature: string
  ): Promise<Record<string, unknown> | null> {
    if (!this.isConfigured() || !this.webhookSecret) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require("stripe");
      const stripe = new Stripe(this.secretKey!, { apiVersion: "2024-06-20" });
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async refundPayment(
    order: CheckoutOrder,
    amountCents?: number
  ): Promise<RefundResult> {
    if (!this.isConfigured()) {
      return { success: false, error: "Stripe not configured." };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require("stripe");
      const stripe = new Stripe(this.secretKey!, { apiVersion: "2024-06-20" });

      const refundParams: Record<string, unknown> = {
        metadata: { gameiq_order_id: order.id },
      };
      if (amountCents !== undefined) {
        refundParams.amount = amountCents;
      }

      const refund = await stripe.refunds.create(refundParams);
      return { success: true, refund_id: refund.id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Refund error";
      return { success: false, error: `Refund failed: ${message}` };
    }
  }
}
