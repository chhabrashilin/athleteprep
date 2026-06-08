"use server";

/**
 * lib/cricket/commerce/orders/actions.ts
 * Server actions for cricket order management.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { orderRequestSchema } from "@/lib/cricket/validation/commerce";
import {
  generateOrderNumber,
  isValidOrderStatusTransition,
} from "@/lib/cricket/commerce/policy";
import { logCommerceEvent } from "@/lib/cricket/commerce/events";
import { getCheckoutProvider } from "@/lib/cricket/commerce/providers";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function createCricketOrderRequest(
  input: unknown
): Promise<ActionResult<{ id: string; orderNumber: string; checkoutUrl?: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = orderRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;
  const orderNumber = generateOrderNumber();

  // Calculate totals from items
  const subtotalCents = d.items.reduce(
    (sum, item) => sum + (item.unit_price_cents ?? 0) * item.quantity,
    0
  );

  const { data: order, error } = await supabase
    .from("cricket_orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      league_id: d.league_id ?? null,
      team_id: d.team_id ?? null,
      vendor_id: d.vendor_id ?? null,
      cart_id: d.cart_id ?? null,
      order_type: "request",
      status: "submitted",
      payment_status: "not_required",
      fulfillment_status: "not_started",
      currency: "USD",
      subtotal_cents: subtotalCents,
      total_cents: subtotalCents,
      customer_name: d.customer_name,
      customer_email: d.customer_email,
      customer_phone: d.customer_phone ?? null,
      shipping_address: d.shipping_address ?? {},
      notes: d.notes ?? null,
      provider: "request_only",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create order" };

  const orderId = order.id as string;

  // Insert order items
  if (d.items.length > 0) {
    const items = d.items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      product_name: item.product_name,
      variant_name: item.variant_name ?? null,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents ?? null,
      total_price_cents:
        item.unit_price_cents != null ? item.unit_price_cents * item.quantity : null,
      customization: item.customization ?? {},
    }));
    await supabase.from("cricket_order_items").insert(items);
  }

  // Get checkout session (request_only returns order URL)
  const provider = getCheckoutProvider();
  const session = await provider.createCheckoutSession({
    id: orderId,
    order_number: orderNumber,
    currency: "USD",
    total_cents: subtotalCents,
    customer_name: d.customer_name,
    customer_email: d.customer_email,
    items: d.items.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_cents: i.unit_price_cents ?? null,
    })),
  });

  await logCommerceEvent({
    event_type: "order.submitted",
    actor_user_id: user.id,
    vendor_id: d.vendor_id ?? null,
    league_id: d.league_id ?? null,
    order_id: orderId,
    event_payload: { order_number: orderNumber, order_type: "request" },
  });

  return {
    success: true,
    data: {
      id: orderId,
      orderNumber,
      checkoutUrl: session.session_url ?? `/cricket/store/orders/${orderId}`,
    },
  };
}

export async function updateCricketOrderStatus(
  orderId: string,
  newStatus: string,
  internalNote?: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: order } = await supabase
    .from("cricket_orders")
    .select("id, status, vendor_id, league_id, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { success: false, error: "Order not found" };

  if (!isValidOrderStatusTransition(order.status as string, newStatus)) {
    return {
      success: false,
      error: `Cannot transition order from "${order.status}" to "${newStatus}"`,
    };
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "confirmed") updateData.confirmed_at = new Date().toISOString();
  if (newStatus === "cancelled") updateData.cancelled_at = new Date().toISOString();
  if (internalNote) updateData.internal_notes = internalNote;

  const { error } = await supabase
    .from("cricket_orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) return { success: false, error: "Failed to update order" };

  await logCommerceEvent({
    event_type: "order.status_updated",
    actor_user_id: user.id,
    vendor_id: order.vendor_id as string | null,
    league_id: order.league_id as string | null,
    order_id: orderId,
    event_payload: { from: order.status, to: newStatus },
  });

  return { success: true };
}

export async function cancelCricketOrder(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  return updateCricketOrderStatus(orderId, "cancelled", reason);
}

export async function addCricketOrderInternalNote(
  orderId: string,
  note: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_orders")
    .update({ internal_notes: note })
    .eq("id", orderId);

  if (error) return { success: false, error: "Failed to update note" };
  return { success: true };
}
