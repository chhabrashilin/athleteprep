"use server";

/**
 * lib/cricket/commerce/vendors/actions.ts
 * Server actions for cricket vendor management.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createVendorSchema,
  updateVendorSchema,
} from "@/lib/cricket/validation/vendors";
import { logCommerceEvent } from "@/lib/cricket/commerce/events";
import { userCanManageCricketVendor } from "./queries";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function createCricketVendor(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data, error } = await supabase
    .from("cricket_vendors")
    .insert({
      name: d.name,
      slug: d.slug,
      description: d.description ?? null,
      website_url: d.website_url ?? null,
      logo_url: d.logo_url ?? null,
      contact_name: d.contact_name,
      contact_email: d.contact_email,
      contact_phone: d.contact_phone ?? null,
      business_address: d.business_address ?? null,
      city: d.city ?? null,
      region: d.region ?? null,
      country: d.country ?? null,
      vendor_type: d.vendor_type,
      league_id: d.league_id ?? null,
      status: "pending",
      visibility: "private",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { success: false, error: "A vendor with this slug already exists" };
    return { success: false, error: "Failed to create vendor" };
  }

  await logCommerceEvent({
    event_type: "vendor.created",
    actor_user_id: user.id,
    vendor_id: data.id as string,
    league_id: d.league_id ?? null,
    event_payload: { vendor_name: d.name },
  });

  return { success: true, data: { id: data.id as string } };
}

export async function updateCricketVendor(
  vendorId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const canManage = await userCanManageCricketVendor(user.id, vendorId);
  if (!canManage) return { success: false, error: "Not authorized to manage this vendor" };

  const parsed = updateVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { error } = await supabase
    .from("cricket_vendors")
    .update(parsed.data)
    .eq("id", vendorId);

  if (error) return { success: false, error: "Failed to update vendor" };
  return { success: true };
}

export async function approveCricketVendor(vendorId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  // Verify user is a league admin for this vendor's league
  const { data: vendor } = await supabase
    .from("cricket_vendors")
    .select("id, league_id, name")
    .eq("id", vendorId)
    .maybeSingle();

  if (!vendor) return { success: false, error: "Vendor not found" };

  if (vendor.league_id) {
    const { data: isMember } = await supabase.rpc("user_can_manage_cricket_league", {
      p_league_id: vendor.league_id,
      p_user_id: user.id,
    });
    if (!isMember) return { success: false, error: "Not authorized to approve vendors for this league" };
  }

  const { error } = await supabase
    .from("cricket_vendors")
    .update({ status: "approved", visibility: "public", approved_by: user.id, approved_at: new Date().toISOString() })
    .eq("id", vendorId);

  if (error) return { success: false, error: "Failed to approve vendor" };

  await logCommerceEvent({
    event_type: "vendor.approved",
    actor_user_id: user.id,
    vendor_id: vendorId,
    league_id: vendor.league_id as string | null,
    event_payload: { vendor_name: vendor.name },
  });

  return { success: true };
}

export async function rejectCricketVendor(vendorId: string, reason: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: vendor } = await supabase
    .from("cricket_vendors")
    .select("id, league_id, name")
    .eq("id", vendorId)
    .maybeSingle();

  if (!vendor) return { success: false, error: "Vendor not found" };

  if (vendor.league_id) {
    const { data: isMember } = await supabase.rpc("user_can_manage_cricket_league", {
      p_league_id: vendor.league_id,
      p_user_id: user.id,
    });
    if (!isMember) return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_vendors")
    .update({ status: "rejected" })
    .eq("id", vendorId);

  if (error) return { success: false, error: "Failed to reject vendor" };

  await logCommerceEvent({
    event_type: "vendor.rejected",
    actor_user_id: user.id,
    vendor_id: vendorId,
    league_id: vendor.league_id as string | null,
    event_payload: { vendor_name: vendor.name, reason },
  });

  return { success: true };
}

export async function suspendCricketVendor(vendorId: string, reason: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: vendor } = await supabase
    .from("cricket_vendors")
    .select("id, league_id, name")
    .eq("id", vendorId)
    .maybeSingle();

  if (!vendor) return { success: false, error: "Vendor not found" };

  if (vendor.league_id) {
    const { data: isMember } = await supabase.rpc("user_can_manage_cricket_league", {
      p_league_id: vendor.league_id,
      p_user_id: user.id,
    });
    if (!isMember) return { success: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("cricket_vendors")
    .update({ status: "suspended" })
    .eq("id", vendorId);

  if (error) return { success: false, error: "Failed to suspend vendor" };

  await logCommerceEvent({
    event_type: "vendor.suspended",
    actor_user_id: user.id,
    vendor_id: vendorId,
    league_id: vendor.league_id as string | null,
    event_payload: { vendor_name: vendor.name, reason },
  });

  return { success: true };
}
