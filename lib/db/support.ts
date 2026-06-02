/**
 * lib/db/support.ts — Data access for support_requests.
 *
 * Public inserts use the anon-key server client (respects RLS insert policy).
 * Admin reads and updates use the service-role client (bypasses RLS) and are
 * gated by ADMIN_EMAILS at the call site.
 */
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  CreateSupportRequestInput,
  SupportRequestRow,
  UpdateSupportRequestInput,
} from "@/types/support";

// ---------------------------------------------------------------------------
// Public insert
// ---------------------------------------------------------------------------

export async function createSupportRequest(input: CreateSupportRequestInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured. Your request was not saved.");
  }

  const { error } = await supabase.from("support_requests").insert({
    user_id: input.userId ?? null,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    issue_type: input.issueType,
    team_name: input.teamName?.trim() || null,
    related_url: input.relatedUrl?.trim() || null,
    urgency: input.urgency ?? null,
    message: input.message.trim(),
    consent_to_contact: input.consentToContact,
    status: "open",
    metadata: {},
  });

  if (error) {
    throw new Error("Failed to save your support request. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Admin reads (service role — bypasses RLS, call site must gate by email)
// ---------------------------------------------------------------------------

export async function getSupportRequestsForAdmin(
  filters?: { status?: string; issueType?: string }
): Promise<SupportRequestRow[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured.");
  }

  let query = supabase
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.issueType) {
    query = query.eq("issue_type", filters.issueType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SupportRequestRow[];
}

// ---------------------------------------------------------------------------
// Admin update (service role — call site must gate by admin email)
// ---------------------------------------------------------------------------

export async function updateSupportRequestStatus(
  input: UpdateSupportRequestInput
): Promise<void> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured.");
  }

  const { error } = await supabase
    .from("support_requests")
    .update({
      status: input.status,
      admin_notes: input.adminNotes?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}
