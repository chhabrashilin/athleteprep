/**
 * lib/cricket/commerce/providers/types.ts
 * Checkout provider interface contract.
 * All providers must implement this interface.
 * Raw card data is NEVER accepted — only provider-managed sessions.
 */

export type ProviderStatus = "configured" | "not_configured" | "disabled";

export interface CheckoutOrder {
  id: string;
  order_number: string;
  currency: string;
  total_cents: number;
  customer_name?: string | null;
  customer_email?: string | null;
  items: CheckoutOrderItem[];
}

export interface CheckoutOrderItem {
  product_name: string;
  quantity: number;
  unit_price_cents?: number | null;
}

export interface CheckoutSessionResult {
  success: boolean;
  /** Provider-specific session or redirect URL. Null for request_only. */
  session_url?: string | null;
  /** Provider checkout/session ID stored on the order. */
  provider_checkout_id?: string | null;
  /** Human-readable error if success=false. */
  error?: string;
  /** Mode used to process this checkout. */
  mode: "request_only" | "stripe" | "provider_not_configured";
}

export interface RefundResult {
  success: boolean;
  refund_id?: string;
  error?: string;
}

export interface ProviderStatusResult {
  provider: string;
  status: ProviderStatus;
  message: string;
}

export interface CheckoutProvider {
  /** Short machine-readable key, e.g. "request_only", "stripe". */
  readonly providerKey: string;

  /** Returns true only when all required credentials are present. */
  isConfigured(): boolean;

  /** Returns current provider status for diagnostics. */
  getProviderStatus(): ProviderStatusResult;

  /**
   * Creates a checkout session for the given order.
   * For request_only: marks order with payment_status=not_required and returns success.
   * For real providers: returns a redirect URL. NEVER collects raw card data directly.
   */
  createCheckoutSession(order: CheckoutOrder): Promise<CheckoutSessionResult>;

  /**
   * Verifies an inbound webhook from the provider.
   * Returns the event payload on success, null on signature failure.
   */
  verifyWebhook(
    payload: string,
    signature: string
  ): Promise<Record<string, unknown> | null>;

  /**
   * Issues a full or partial refund.
   * Only applicable when payments were processed (not request_only).
   */
  refundPayment(order: CheckoutOrder, amountCents?: number): Promise<RefundResult>;
}
