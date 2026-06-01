/**
 * lib/db/feedback.ts — Data access for access_requests and product_feedback.
 *
 * Public inserts use the anon-key server client (respects RLS insert policy).
 * Admin reads use the service-role client (bypasses RLS) and are gated by
 * ADMIN_EMAILS at the call site.
 */
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateAccessRequestInput {
  name: string;
  email: string;
  role: string;
  teamOrOrg?: string;
  sport?: string;
  level?: string;
  painPoint?: string;
  filmReviewFrequency?: string;
  currentTools?: string;
  message?: string;
}

export interface CreateProductFeedbackInput {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  teamOrOrg?: string;
  sport?: string;
  usefulnessRating?: number;
  mostValuable?: string;
  mostConfusing?: string;
  mustHaveFeature?: string;
  wouldUseAfterGames?: string;
  currentTools?: string;
  willingnessToPay?: string;
  additionalNotes?: string;
}

// ---------------------------------------------------------------------------
// Row types (as returned by Supabase)
// ---------------------------------------------------------------------------

export interface AccessRequestRow {
  id: string;
  name: string;
  email: string;
  role: string;
  team_or_org: string | null;
  sport: string | null;
  level: string | null;
  pain_point: string | null;
  film_review_frequency: string | null;
  current_tools: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProductFeedbackRow {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  team_or_org: string | null;
  sport: string | null;
  usefulness_rating: number | null;
  most_valuable: string | null;
  most_confusing: string | null;
  must_have_feature: string | null;
  would_use_after_games: string | null;
  current_tools: string | null;
  willingness_to_pay: string | null;
  additional_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Public inserts (uses anon-key client, allowed by RLS policy)
// ---------------------------------------------------------------------------

export async function createAccessRequest(input: CreateAccessRequestInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured. Your request was not saved.");
  }

  const { error } = await supabase.from("access_requests").insert({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role.trim(),
    team_or_org: input.teamOrOrg?.trim() || null,
    sport: input.sport?.trim() || null,
    level: input.level?.trim() || null,
    pain_point: input.painPoint?.trim() || null,
    film_review_frequency: input.filmReviewFrequency?.trim() || null,
    current_tools: input.currentTools?.trim() || null,
    message: input.message?.trim() || null,
    metadata: {},
  });

  if (error) {
    throw new Error("Failed to save your request. Please try again.");
  }
}

export async function createProductFeedback(input: CreateProductFeedbackInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured. Your feedback was not saved.");
  }

  const { error } = await supabase.from("product_feedback").insert({
    user_id: input.userId ?? null,
    name: input.name?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    role: input.role?.trim() || null,
    team_or_org: input.teamOrOrg?.trim() || null,
    sport: input.sport?.trim() || null,
    usefulness_rating: input.usefulnessRating ?? null,
    most_valuable: input.mostValuable?.trim() || null,
    most_confusing: input.mostConfusing?.trim() || null,
    must_have_feature: input.mustHaveFeature?.trim() || null,
    would_use_after_games: input.wouldUseAfterGames?.trim() || null,
    current_tools: input.currentTools?.trim() || null,
    willingness_to_pay: input.willingnessToPay?.trim() || null,
    additional_notes: input.additionalNotes?.trim() || null,
    metadata: {},
  });

  if (error) {
    throw new Error("Failed to save your feedback. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Admin reads (service role — bypasses RLS, call site must gate by email)
// ---------------------------------------------------------------------------

export async function getAccessRequestsForAdmin(): Promise<AccessRequestRow[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured.");
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as AccessRequestRow[];
}

export async function getProductFeedbackForAdmin(): Promise<ProductFeedbackRow[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Database not configured.");
  }

  const { data, error } = await supabase
    .from("product_feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductFeedbackRow[];
}
