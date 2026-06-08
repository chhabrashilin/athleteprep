/**
 * lib/cricket/commerce/products/queries.ts
 * Read-only data access for cricket marketplace products.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CricketProduct {
  id: string;
  vendorId: string | null;
  leagueId: string | null;
  categoryId: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  productType: string;
  status: string;
  visibility: string;
  currency: string;
  priceCents: number | null;
  compareAtPriceCents: number | null;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  inventoryStatus: string;
  inventoryQuantity: number | null;
  sku: string | null;
  imageUrls: string[];
  tags: string[];
  specifications: Record<string, unknown>;
  sizingInfo: Record<string, unknown>;
  shippingInfo: Record<string, unknown>;
  approvalStatus: string;
  approvedAt: string | null;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

function rowToProduct(row: Record<string, unknown>): CricketProduct {
  return {
    id: row.id as string,
    vendorId: (row.vendor_id as string | null) ?? null,
    leagueId: (row.league_id as string | null) ?? null,
    categoryId: (row.category_id as string | null) ?? null,
    name: row.name as string,
    slug: row.slug as string,
    shortDescription: (row.short_description as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    productType: row.product_type as string,
    status: row.status as string,
    visibility: row.visibility as string,
    currency: row.currency as string,
    priceCents: (row.price_cents as number | null) ?? null,
    compareAtPriceCents: (row.compare_at_price_cents as number | null) ?? null,
    minOrderQuantity: (row.min_order_quantity as number) ?? 1,
    maxOrderQuantity: (row.max_order_quantity as number | null) ?? null,
    inventoryStatus: (row.inventory_status as string) ?? "unknown",
    inventoryQuantity: (row.inventory_quantity as number | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    imageUrls: (row.image_urls as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    specifications: (row.specifications as Record<string, unknown>) ?? {},
    sizingInfo: (row.sizing_info as Record<string, unknown>) ?? {},
    shippingInfo: (row.shipping_info as Record<string, unknown>) ?? {},
    approvalStatus: row.approval_status as string,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export interface ProductFilters {
  categoryId?: string;
  vendorId?: string;
  productType?: string;
  leagueId?: string;
  search?: string;
}

export async function getCricketMarketplaceProducts(
  filters: ProductFilters = {}
): Promise<CricketProduct[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_products")
    .select("*")
    .eq("status", "active")
    .eq("visibility", "public")
    .eq("approval_status", "approved")
    .order("name");

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.vendorId) query = query.eq("vendor_id", filters.vendorId);
  if (filters.productType) query = query.eq("product_type", filters.productType);
  if (filters.leagueId) query = query.eq("league_id", filters.leagueId);

  const { data } = await query;
  let products = (data ?? []).map((r) => rowToProduct(r as Record<string, unknown>));

  if (filters.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.shortDescription?.toLowerCase().includes(q) ?? false) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return products;
}

export async function getCricketProductBySlug(
  vendorSlug: string,
  productSlug: string
): Promise<CricketProduct | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data: vendor } = await supabase
    .from("cricket_vendors")
    .select("id")
    .eq("slug", vendorSlug)
    .maybeSingle();

  if (!vendor) return null;

  const { data } = await supabase
    .from("cricket_products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("slug", productSlug)
    .maybeSingle();

  if (!data) return null;
  return rowToProduct(data as Record<string, unknown>);
}

export async function getCricketProductById(productId: string): Promise<CricketProduct | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (!data) return null;
  return rowToProduct(data as Record<string, unknown>);
}

export async function getVendorProducts(vendorId: string): Promise<CricketProduct[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_products")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToProduct(r as Record<string, unknown>));
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_product_categories")
    .select("id, slug, name, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  return (data ?? []).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
  }));
}

export async function searchCricketProducts(
  query: string,
  filters: ProductFilters = {}
): Promise<CricketProduct[]> {
  return getCricketMarketplaceProducts({ ...filters, search: query });
}
