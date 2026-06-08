"use server";

/**
 * lib/cricket/commerce/cart/actions.ts
 * Cart management server actions.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { cartItemSchema } from "@/lib/cricket/validation/commerce";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CartWithItems {
  id: string;
  userId: string | null;
  currency: string;
  status: string;
  items: CartItem[];
  subtotalCents: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPriceCents: number | null;
  customization: Record<string, unknown>;
}

export async function getOrCreateCricketCart(
  userId: string,
  sessionId?: string
): Promise<ActionResult<{ cartId: string }>> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Find existing active cart
  const { data: existing } = await supabase
    .from("cricket_carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { success: true, data: { cartId: existing.id as string } };

  // Create a new cart
  const { data, error } = await supabase
    .from("cricket_carts")
    .insert({
      user_id: userId,
      session_id: sessionId ?? null,
      currency: "USD",
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create cart" };
  return { success: true, data: { cartId: data.id as string } };
}

export async function getCricketCart(cartId: string): Promise<ActionResult<CartWithItems>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: cart } = await supabase
    .from("cricket_carts")
    .select("*, cricket_cart_items(*)")
    .eq("id", cartId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cart) return { success: false, error: "Cart not found" };

  const cartItems = (cart.cricket_cart_items ?? []) as Record<string, unknown>[];
  const items: CartItem[] = cartItems.map((item) => ({
    id: item.id as string,
    productId: item.product_id as string,
    variantId: (item.variant_id as string | null) ?? null,
    quantity: item.quantity as number,
    unitPriceCents: (item.unit_price_cents as number | null) ?? null,
    customization: (item.customization as Record<string, unknown>) ?? {},
  }));

  const subtotalCents = items.reduce(
    (sum, i) => sum + (i.unitPriceCents ?? 0) * i.quantity,
    0
  );

  return {
    success: true,
    data: {
      id: cart.id as string,
      userId: (cart.user_id as string | null) ?? null,
      currency: (cart.currency as string) ?? "USD",
      status: cart.status as string,
      items,
      subtotalCents,
    },
  };
}

export async function addCricketCartItem(
  input: unknown
): Promise<ActionResult<{ itemId: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = cartItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;

  const cartResult = await getOrCreateCricketCart(user.id);
  if (!cartResult.success || !cartResult.data) {
    return { success: false, error: cartResult.error ?? "Could not get cart" };
  }

  const cartId = cartResult.data.cartId;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Get product price
  const { data: product } = await supabase
    .from("cricket_products")
    .select("price_cents")
    .eq("id", d.product_id)
    .maybeSingle();

  // Check if item already in cart
  const { data: existing } = await supabase
    .from("cricket_cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", d.product_id)
    .eq("variant_id", d.variant_id ?? null as unknown as string)
    .maybeSingle();

  if (existing) {
    const newQty = (existing.quantity as number) + d.quantity;
    await supabase
      .from("cricket_cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id);
    return { success: true, data: { itemId: existing.id as string } };
  }

  const { data, error } = await supabase
    .from("cricket_cart_items")
    .insert({
      cart_id: cartId,
      product_id: d.product_id,
      variant_id: d.variant_id ?? null,
      quantity: d.quantity,
      unit_price_cents: product?.price_cents ?? null,
      customization: d.customization ?? {},
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to add item to cart" };
  return { success: true, data: { itemId: data.id as string } };
}

export async function updateCricketCartItem(
  itemId: string,
  quantity: number
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (quantity < 1) return { success: false, error: "Quantity must be at least 1" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_cart_items")
    .update({ quantity })
    .eq("id", itemId);

  if (error) return { success: false, error: "Failed to update cart item" };
  return { success: true };
}

export async function removeCricketCartItem(itemId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  await supabase.from("cricket_cart_items").delete().eq("id", itemId);
  return { success: true };
}

export async function clearCricketCart(cartId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  await supabase
    .from("cricket_cart_items")
    .delete()
    .eq("cart_id", cartId);

  return { success: true };
}
