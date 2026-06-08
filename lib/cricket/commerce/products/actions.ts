"use server";

/**
 * lib/cricket/commerce/products/actions.ts
 * Server actions for cricket product management.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { createProductSchema, updateProductSchema } from "@/lib/cricket/validation/vendors";
import { sanitizeProductDescription, classifyProductPolicyRisk } from "@/lib/cricket/commerce/policy";
import { logCommerceEvent } from "@/lib/cricket/commerce/events";
import { userCanManageCricketVendor } from "@/lib/cricket/commerce/vendors/queries";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function createCricketProduct(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;

  // Verify vendor ownership
  if (d.vendor_id) {
    const canManage = await userCanManageCricketVendor(user.id, d.vendor_id);
    if (!canManage) return { success: false, error: "Not authorized to add products to this vendor" };
  }

  // Run policy check
  const policy = classifyProductPolicyRisk({
    name: d.name,
    description: d.description ?? undefined,
    short_description: d.short_description ?? undefined,
    tags: d.tags,
  });
  if (policy.risk === "prohibited") {
    return { success: false, error: `Product is not allowed: ${policy.reasons.join("; ")}` };
  }

  const warnings: string[] = [];
  if (policy.risk === "needs_review") {
    warnings.push("This product has been flagged for admin review before it can go public.");
  }

  const sanitizedDescription = d.description
    ? sanitizeProductDescription(d.description)
    : null;
  const sanitizedShortDesc = d.short_description
    ? sanitizeProductDescription(d.short_description)
    : null;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data, error } = await supabase
    .from("cricket_products")
    .insert({
      vendor_id: d.vendor_id,
      league_id: d.league_id ?? null,
      category_id: d.category_id ?? null,
      name: d.name,
      slug: d.slug,
      short_description: sanitizedShortDesc,
      description: sanitizedDescription,
      product_type: d.product_type,
      currency: d.currency,
      price_cents: d.price_cents ?? null,
      compare_at_price_cents: d.compare_at_price_cents ?? null,
      min_order_quantity: d.min_order_quantity,
      max_order_quantity: d.max_order_quantity ?? null,
      inventory_status: d.inventory_status,
      inventory_quantity: d.inventory_quantity ?? null,
      sku: d.sku ?? null,
      image_urls: d.image_urls,
      tags: d.tags,
      specifications: d.specifications,
      sizing_info: d.sizing_info,
      shipping_info: d.shipping_info,
      status: "draft",
      visibility: "private",
      approval_status: "pending",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A product with this slug already exists for this vendor" };
    return { success: false, error: "Failed to create product" };
  }

  await logCommerceEvent({
    event_type: "product.created",
    actor_user_id: user.id,
    vendor_id: d.vendor_id,
    league_id: d.league_id ?? null,
    event_payload: { product_name: d.name, product_id: data.id },
  });

  return { success: true, data: { id: data.id as string }, warnings };
}

export async function updateCricketProduct(
  productId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Check ownership
  const { data: existing } = await supabase
    .from("cricket_products")
    .select("id, vendor_id, created_by")
    .eq("id", productId)
    .maybeSingle();

  if (!existing) return { success: false, error: "Product not found" };

  const isOwner = existing.created_by === user.id;
  const isVendorManager =
    existing.vendor_id
      ? await userCanManageCricketVendor(user.id, existing.vendor_id as string)
      : false;

  if (!isOwner && !isVendorManager) {
    return { success: false, error: "Not authorized to edit this product" };
  }

  const d = parsed.data;
  const update: Record<string, unknown> = { ...d };

  if (d.description) update.description = sanitizeProductDescription(d.description);
  if (d.short_description) update.short_description = sanitizeProductDescription(d.short_description);

  const { error } = await supabase
    .from("cricket_products")
    .update(update)
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to update product" };
  return { success: true };
}

export async function submitCricketProductForApproval(productId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: product } = await supabase
    .from("cricket_products")
    .select("id, vendor_id, created_by, name")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { success: false, error: "Product not found" };

  const isOwner = product.created_by === user.id;
  const isVendorManager =
    product.vendor_id
      ? await userCanManageCricketVendor(user.id, product.vendor_id as string)
      : false;

  if (!isOwner && !isVendorManager) {
    return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_products")
    .update({ approval_status: "pending", status: "draft" })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to submit for approval" };

  await logCommerceEvent({
    event_type: "product.submitted_for_approval",
    actor_user_id: user.id,
    vendor_id: product.vendor_id as string | null,
    event_payload: { product_id: productId, product_name: product.name },
  });

  return { success: true };
}

export async function approveCricketProduct(productId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: product } = await supabase
    .from("cricket_products")
    .select("id, vendor_id, league_id, name")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { success: false, error: "Product not found" };

  // Must be league admin
  if (product.league_id) {
    const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
      p_league_id: product.league_id,
      p_user_id: user.id,
    });
    if (!canManage) return { success: false, error: "Not authorized to approve products" };
  }

  const { error } = await supabase
    .from("cricket_products")
    .update({
      approval_status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      status: "active",
      visibility: "public",
    })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to approve product" };

  await logCommerceEvent({
    event_type: "product.approved",
    actor_user_id: user.id,
    vendor_id: product.vendor_id as string | null,
    league_id: product.league_id as string | null,
    event_payload: { product_id: productId, product_name: product.name },
  });

  return { success: true };
}

export async function rejectCricketProduct(
  productId: string,
  reason: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: product } = await supabase
    .from("cricket_products")
    .select("id, league_id, vendor_id, name")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { success: false, error: "Product not found" };

  if (product.league_id) {
    const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
      p_league_id: product.league_id,
      p_user_id: user.id,
    });
    if (!canManage) return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_products")
    .update({ approval_status: "rejected" })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to reject product" };

  await logCommerceEvent({
    event_type: "product.rejected",
    actor_user_id: user.id,
    vendor_id: product.vendor_id as string | null,
    league_id: product.league_id as string | null,
    event_payload: { product_id: productId, product_name: product.name, reason },
  });

  return { success: true };
}

export async function archiveCricketProduct(productId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: product } = await supabase
    .from("cricket_products")
    .select("id, vendor_id, created_by")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { success: false, error: "Product not found" };

  const isOwner = product.created_by === user.id;
  const isVendorManager = product.vendor_id
    ? await userCanManageCricketVendor(user.id, product.vendor_id as string)
    : false;

  if (!isOwner && !isVendorManager) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_products")
    .update({ status: "archived", visibility: "private" })
    .eq("id", productId);

  if (error) return { success: false, error: "Failed to archive product" };
  return { success: true };
}
