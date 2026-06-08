"use server";

/**
 * lib/cricket/commerce/sponsorship/actions.ts
 * Server actions for sponsorship packages and inquiries.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createSponsorshipPackageSchema,
  updateSponsorshipPackageSchema,
  createSponsorshipInquirySchema,
} from "@/lib/cricket/validation/sponsorship";
import { logCommerceEvent } from "@/lib/cricket/commerce/events";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SponsorshipPackage {
  id: string;
  leagueId: string;
  teamId: string | null;
  matchId: string | null;
  name: string;
  slug: string;
  description: string | null;
  packageType: string;
  status: string;
  visibility: string;
  currency: string;
  priceCents: number | null;
  inventoryQuantity: number | null;
  benefits: string[];
  placementOptions: Record<string, unknown>;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

function rowToPackage(row: Record<string, unknown>): SponsorshipPackage {
  return {
    id: row.id as string,
    leagueId: row.league_id as string,
    teamId: (row.team_id as string | null) ?? null,
    matchId: (row.match_id as string | null) ?? null,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    packageType: row.package_type as string,
    status: row.status as string,
    visibility: row.visibility as string,
    currency: (row.currency as string) ?? "USD",
    priceCents: (row.price_cents as number | null) ?? null,
    inventoryQuantity: (row.inventory_quantity as number | null) ?? null,
    benefits: (row.benefits as string[]) ?? [],
    placementOptions: (row.placement_options as Record<string, unknown>) ?? {},
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getLeagueSponsorshipPackages(
  leagueId: string,
  adminView = false
): Promise<SponsorshipPackage[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from("cricket_sponsorship_packages")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false });

  if (!adminView) {
    query = query.in("visibility", ["public", "unlisted"]).eq("status", "active");
  }

  const { data } = await query;
  return (data ?? []).map((r) => rowToPackage(r as Record<string, unknown>));
}

export async function createSponsorshipPackage(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createSponsorshipPackageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
    p_league_id: d.league_id,
    p_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized to manage this league" };

  const { data, error } = await supabase
    .from("cricket_sponsorship_packages")
    .insert({
      league_id: d.league_id,
      team_id: d.team_id ?? null,
      match_id: d.match_id ?? null,
      name: d.name,
      slug: d.slug,
      description: d.description ?? null,
      package_type: d.package_type,
      currency: d.currency,
      price_cents: d.price_cents ?? null,
      inventory_quantity: d.inventory_quantity ?? null,
      benefits: d.benefits,
      placement_options: d.placement_options,
      start_date: d.start_date ?? null,
      end_date: d.end_date ?? null,
      visibility: d.visibility,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A package with this slug already exists" };
    return { success: false, error: "Failed to create sponsorship package" };
  }

  await logCommerceEvent({
    event_type: "sponsorship.package_created",
    actor_user_id: user.id,
    league_id: d.league_id,
    event_payload: { package_id: data.id, package_name: d.name },
  });

  return { success: true, data: { id: data.id as string } };
}

export async function updateSponsorshipPackage(
  packageId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateSponsorshipPackageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: pkg } = await supabase
    .from("cricket_sponsorship_packages")
    .select("id, league_id")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) return { success: false, error: "Package not found" };

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
    p_league_id: pkg.league_id,
    p_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_sponsorship_packages")
    .update(parsed.data)
    .eq("id", packageId);

  if (error) return { success: false, error: "Failed to update package" };
  return { success: true };
}

export async function activateSponsorshipPackage(packageId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: pkg } = await supabase
    .from("cricket_sponsorship_packages")
    .select("id, league_id")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) return { success: false, error: "Package not found" };

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
    p_league_id: pkg.league_id,
    p_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_sponsorship_packages")
    .update({ status: "active" })
    .eq("id", packageId);

  if (error) return { success: false, error: "Failed to activate package" };
  return { success: true };
}

export async function archiveSponsorshipPackage(packageId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: pkg } = await supabase
    .from("cricket_sponsorship_packages")
    .select("id, league_id")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) return { success: false, error: "Package not found" };

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
    p_league_id: pkg.league_id,
    p_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_sponsorship_packages")
    .update({ status: "archived", visibility: "private" })
    .eq("id", packageId);

  if (error) return { success: false, error: "Failed to archive package" };
  return { success: true };
}

export async function createSponsorshipInquiry(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSponsorshipInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data, error } = await supabase
    .from("cricket_sponsorship_inquiries")
    .insert({
      package_id: d.package_id ?? null,
      league_id: d.league_id,
      team_id: d.team_id ?? null,
      match_id: d.match_id ?? null,
      company_name: d.company_name,
      contact_name: d.contact_name,
      contact_email: d.contact_email,
      contact_phone: d.contact_phone ?? null,
      message: d.message ?? null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to submit inquiry" };

  await logCommerceEvent({
    event_type: "sponsorship.inquiry_submitted",
    league_id: d.league_id,
    event_payload: {
      inquiry_id: data.id,
      company_name: d.company_name,
      package_id: d.package_id ?? null,
    },
  });

  return { success: true, data: { id: data.id as string } };
}

export async function updateSponsorshipInquiryStatus(
  inquiryId: string,
  status: string
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: inquiry } = await supabase
    .from("cricket_sponsorship_inquiries")
    .select("id, league_id")
    .eq("id", inquiryId)
    .maybeSingle();

  if (!inquiry) return { success: false, error: "Inquiry not found" };

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_league", {
    p_league_id: inquiry.league_id,
    p_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_sponsorship_inquiries")
    .update({ status, assigned_to: user.id })
    .eq("id", inquiryId);

  if (error) return { success: false, error: "Failed to update inquiry status" };
  return { success: true };
}
