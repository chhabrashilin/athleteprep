/**
 * lib/cricket/commerce/vendors/queries.ts
 * Read-only data access for cricket vendors.
 * Call only from Server Components or Server Actions.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CricketVendor {
  id: string;
  leagueId: string | null;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  country: string | null;
  status: string;
  visibility: string;
  vendorType: string;
  approvedAt: string | null;
  createdAt: string;
}

function rowToVendor(row: Record<string, unknown>): CricketVendor {
  return {
    id: row.id as string,
    leagueId: (row.league_id as string | null) ?? null,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    contactName: (row.contact_name as string | null) ?? null,
    contactEmail: (row.contact_email as string | null) ?? null,
    contactPhone: (row.contact_phone as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    status: row.status as string,
    visibility: row.visibility as string,
    vendorType: row.vendor_type as string,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getApprovedCricketVendors(leagueId?: string): Promise<CricketVendor[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_vendors")
    .select("*")
    .eq("status", "approved")
    .eq("visibility", "public")
    .order("name");

  if (leagueId) {
    query = query.eq("league_id", leagueId);
  }

  const { data } = await query;
  return (data ?? []).map((r) => rowToVendor(r as Record<string, unknown>));
}

export async function getCricketVendorBySlug(slug: string): Promise<CricketVendor | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_vendors")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  return rowToVendor(data as Record<string, unknown>);
}

export async function getCricketVendorById(vendorId: string): Promise<CricketVendor | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_vendors")
    .select("*")
    .eq("id", vendorId)
    .maybeSingle();

  if (!data) return null;
  return rowToVendor(data as Record<string, unknown>);
}

export async function getVendorsForLeagueAdmin(leagueId: string): Promise<CricketVendor[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_vendors")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToVendor(r as Record<string, unknown>));
}

export async function getVendorsByCreator(userId: string): Promise<CricketVendor[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_vendors")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToVendor(r as Record<string, unknown>));
}

export async function userCanManageCricketVendor(
  userId: string,
  vendorId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase.rpc("user_can_manage_cricket_vendor", {
    p_vendor_id: vendorId,
    p_user_id: userId,
  });
  return Boolean(data);
}
