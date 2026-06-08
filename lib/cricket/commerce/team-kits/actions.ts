"use server";

/**
 * lib/cricket/commerce/team-kits/actions.ts
 * Server actions for cricket team kit requests.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import {
  createTeamKitRequestSchema,
  updateTeamKitRequestSchema,
  quoteTeamKitRequestSchema,
} from "@/lib/cricket/validation/team-kit";
import { isValidKitRequestStatusTransition } from "@/lib/cricket/commerce/policy";
import { logCommerceEvent } from "@/lib/cricket/commerce/events";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TeamKitRequest {
  id: string;
  teamId: string;
  leagueId: string | null;
  vendorId: string | null;
  requestedBy: string | null;
  status: string;
  kitType: string;
  quantityPlayers: number | null;
  quantityStaff: number | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  logoUrl: string | null;
  sponsorLogoUrl: string | null;
  designNotes: string | null;
  sizeBreakdown: Record<string, unknown>;
  deliveryDeadline: string | null;
  budgetCents: number | null;
  currency: string;
  quoteAmountCents: number | null;
  orderId: string | null;
  createdAt: string;
}

function rowToKitRequest(row: Record<string, unknown>): TeamKitRequest {
  return {
    id: row.id as string,
    teamId: row.team_id as string,
    leagueId: (row.league_id as string | null) ?? null,
    vendorId: (row.vendor_id as string | null) ?? null,
    requestedBy: (row.requested_by as string | null) ?? null,
    status: row.status as string,
    kitType: row.kit_type as string,
    quantityPlayers: (row.quantity_players as number | null) ?? null,
    quantityStaff: (row.quantity_staff as number | null) ?? null,
    primaryColor: (row.primary_color as string | null) ?? null,
    secondaryColor: (row.secondary_color as string | null) ?? null,
    accentColor: (row.accent_color as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    sponsorLogoUrl: (row.sponsor_logo_url as string | null) ?? null,
    designNotes: (row.design_notes as string | null) ?? null,
    sizeBreakdown: (row.size_breakdown as Record<string, unknown>) ?? {},
    deliveryDeadline: (row.delivery_deadline as string | null) ?? null,
    budgetCents: (row.budget_cents as number | null) ?? null,
    currency: (row.currency as string) ?? "USD",
    quoteAmountCents: (row.quote_amount_cents as number | null) ?? null,
    orderId: (row.order_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function getTeamKitRequests(teamId: string): Promise<TeamKitRequest[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("cricket_team_kit_requests")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => rowToKitRequest(r as Record<string, unknown>));
}

export async function getTeamKitRequest(requestId: string): Promise<TeamKitRequest | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("cricket_team_kit_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!data) return null;
  return rowToKitRequest(data as Record<string, unknown>);
}

export async function createTeamKitRequest(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = createTeamKitRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const d = parsed.data;

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_team", {
    cricket_team_id: d.team_id,
    check_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized to create kit requests for this team" };

  const { data, error } = await supabase
    .from("cricket_team_kit_requests")
    .insert({
      team_id: d.team_id,
      league_id: d.league_id ?? null,
      vendor_id: d.vendor_id ?? null,
      requested_by: user.id,
      status: "draft",
      kit_type: d.kit_type,
      quantity_players: d.quantity_players ?? null,
      quantity_staff: d.quantity_staff ?? null,
      primary_color: d.primary_color ?? null,
      secondary_color: d.secondary_color ?? null,
      accent_color: d.accent_color ?? null,
      logo_url: d.logo_url ?? null,
      sponsor_logo_url: d.sponsor_logo_url ?? null,
      design_notes: d.design_notes ?? null,
      size_breakdown: d.size_breakdown,
      delivery_deadline: d.delivery_deadline ?? null,
      budget_cents: d.budget_cents ?? null,
      currency: d.currency,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: "Failed to create kit request" };

  await logCommerceEvent({
    event_type: "kit_request.created",
    actor_user_id: user.id,
    team_id: d.team_id,
    league_id: d.league_id ?? null,
    event_payload: { request_id: data.id, kit_type: d.kit_type },
  });

  return { success: true, data: { id: data.id as string } };
}

export async function updateTeamKitRequest(
  requestId: string,
  input: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = updateTeamKitRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: req } = await supabase
    .from("cricket_team_kit_requests")
    .select("id, team_id, status, requested_by")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { success: false, error: "Kit request not found" };
  if (!["draft", "submitted"].includes(req.status as string)) {
    return { success: false, error: "Cannot edit a kit request in this state" };
  }

  const isRequester = req.requested_by === user.id;
  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_team", {
    cricket_team_id: req.team_id,
    check_user_id: user.id,
  });

  if (!isRequester && !canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_team_kit_requests")
    .update(parsed.data)
    .eq("id", requestId);

  if (error) return { success: false, error: "Failed to update kit request" };
  return { success: true };
}

export async function submitTeamKitRequest(requestId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: req } = await supabase
    .from("cricket_team_kit_requests")
    .select("id, team_id, status, kit_type, league_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { success: false, error: "Kit request not found" };

  if (!isValidKitRequestStatusTransition(req.status as string, "submitted")) {
    return { success: false, error: `Cannot submit a request in "${req.status}" state` };
  }

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_team", {
    cricket_team_id: req.team_id,
    check_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_team_kit_requests")
    .update({ status: "submitted" })
    .eq("id", requestId);

  if (error) return { success: false, error: "Failed to submit kit request" };

  await logCommerceEvent({
    event_type: "kit_request.submitted",
    actor_user_id: user.id,
    team_id: req.team_id as string,
    league_id: req.league_id as string | null,
    event_payload: { request_id: requestId, kit_type: req.kit_type },
  });

  return { success: true };
}

export async function quoteTeamKitRequest(
  requestId: string,
  quoteInput: unknown
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = quoteTeamKitRequestSchema.safeParse(quoteInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid quote input" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: req } = await supabase
    .from("cricket_team_kit_requests")
    .select("id, team_id, status, vendor_id, league_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { success: false, error: "Kit request not found" };

  if (!isValidKitRequestStatusTransition(req.status as string, "quoted")) {
    return { success: false, error: `Cannot quote a request in "${req.status}" state` };
  }

  const { error } = await supabase
    .from("cricket_team_kit_requests")
    .update({
      status: "quoted",
      quote_amount_cents: parsed.data.quote_amount_cents,
      currency: parsed.data.currency,
    })
    .eq("id", requestId);

  if (error) return { success: false, error: "Failed to save quote" };

  await logCommerceEvent({
    event_type: "kit_request.quoted",
    actor_user_id: user.id,
    team_id: req.team_id as string,
    vendor_id: req.vendor_id as string | null,
    league_id: req.league_id as string | null,
    event_payload: {
      request_id: requestId,
      quote_amount_cents: parsed.data.quote_amount_cents,
    },
  });

  return { success: true };
}

export async function approveTeamKitQuote(requestId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: req } = await supabase
    .from("cricket_team_kit_requests")
    .select("id, team_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { success: false, error: "Kit request not found" };

  if (!isValidKitRequestStatusTransition(req.status as string, "approved")) {
    return { success: false, error: `Cannot approve in "${req.status}" state` };
  }

  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_team", {
    cricket_team_id: req.team_id,
    check_user_id: user.id,
  });
  if (!canManage) return { success: false, error: "Not authorized" };

  const { error } = await supabase
    .from("cricket_team_kit_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (error) return { success: false, error: "Failed to approve quote" };
  return { success: true };
}

export async function cancelTeamKitRequest(requestId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const { data: req } = await supabase
    .from("cricket_team_kit_requests")
    .select("id, team_id, status, requested_by")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return { success: false, error: "Kit request not found" };

  const isRequester = req.requested_by === user.id;
  const { data: canManage } = await supabase.rpc("user_can_manage_cricket_team", {
    cricket_team_id: req.team_id,
    check_user_id: user.id,
  });

  if (!isRequester && !canManage) return { success: false, error: "Not authorized" };

  if (!isValidKitRequestStatusTransition(req.status as string, "cancelled")) {
    return { success: false, error: `Cannot cancel a request in "${req.status}" state` };
  }

  const { error } = await supabase
    .from("cricket_team_kit_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) return { success: false, error: "Failed to cancel kit request" };
  return { success: true };
}
