/**
 * lib/cricket/commerce/orders/queries.ts
 * Read-only data access for cricket orders.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CricketOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  leagueId: string | null;
  teamId: string | null;
  vendorId: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  customerName: string | null;
  customerEmail: string | null;
  notes: string | null;
  provider: string;
  submittedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

function rowToOrder(row: Record<string, unknown>): CricketOrder {
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    userId: (row.user_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    teamId: (row.team_id as string | null) ?? null,
    vendorId: (row.vendor_id as string | null) ?? null,
    orderType: row.order_type as string,
    status: row.status as string,
    paymentStatus: row.payment_status as string,
    fulfillmentStatus: row.fulfillment_status as string,
    currency: row.currency as string,
    subtotalCents: (row.subtotal_cents as number) ?? 0,
    taxCents: (row.tax_cents as number) ?? 0,
    shippingCents: (row.shipping_cents as number) ?? 0,
    discountCents: (row.discount_cents as number) ?? 0,
    totalCents: (row.total_cents as number) ?? 0,
    customerName: (row.customer_name as string | null) ?? null,
    customerEmail: (row.customer_email as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    provider: (row.provider as string) ?? "request_only",
    submittedAt: row.submitted_at as string,
    confirmedAt: (row.confirmed_at as string | null) ?? null,
    cancelledAt: (row.cancelled_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getCricketOrder(orderId: string): Promise<CricketOrder | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!data) return null;
  return rowToOrder(data as Record<string, unknown>);
}

export async function getUserCricketOrders(userId: string): Promise<CricketOrder[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToOrder(r as Record<string, unknown>));
}

export async function getVendorCricketOrders(vendorId: string): Promise<CricketOrder[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_orders")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToOrder(r as Record<string, unknown>));
}

export async function getLeagueCommerceOrders(leagueId: string): Promise<CricketOrder[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_orders")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToOrder(r as Record<string, unknown>));
}
