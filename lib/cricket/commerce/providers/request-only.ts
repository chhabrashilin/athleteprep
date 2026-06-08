/**
 * lib/cricket/commerce/providers/request-only.ts
 * The default "request_only" checkout provider.
 * No payment is processed. All orders become inquiry/request records.
 * Always configured. Production-safe and fully supported.
 */

import type {
  CheckoutProvider,
  CheckoutOrder,
  CheckoutSessionResult,
  RefundResult,
  ProviderStatusResult,
} from "./types";

export class RequestOnlyProvider implements CheckoutProvider {
  readonly providerKey = "request_only";

  isConfigured(): boolean {
    return true;
  }

  getProviderStatus(): ProviderStatusResult {
    return {
      provider: this.providerKey,
      status: "configured",
      message:
        "Request-only mode is active. Orders are submitted as inquiries. No payment is processed.",
    };
  }

  async createCheckoutSession(
    order: CheckoutOrder
  ): Promise<CheckoutSessionResult> {
    // No external call needed. The order was already created as a request.
    return {
      success: true,
      session_url: `/cricket/store/orders/${order.id}`,
      provider_checkout_id: null,
      mode: "request_only",
    };
  }

  async verifyWebhook(
    _payload: string,
    _signature: string
  ): Promise<Record<string, unknown> | null> {
    // Request-only provider has no webhooks.
    return null;
  }

  async refundPayment(
    _order: CheckoutOrder,
    _amountCents?: number
  ): Promise<RefundResult> {
    // No payment was taken; nothing to refund.
    return {
      success: false,
      error:
        "Cannot refund a request-only order. No payment was collected.",
    };
  }
}
