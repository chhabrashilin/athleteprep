/**
 * lib/db/product-events.ts — Data access for the product_events table.
 *
 * Public inserts: use anon/auth server client (RLS allows user_id = auth.uid or null).
 * Admin reads:    use service-role client; call site must enforce ADMIN_EMAILS gate.
 *
 * Privacy rules (enforced in track.ts, documented here):
 *  - Never store free-text coach notes, player feedback, or AI report content.
 *  - Store IDs, counts, statuses, enums — not content.
 *  - Metadata examples: { sport, playerCount, eventCount, hasVideo, provider, confidence }
 */
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  TrackEventInput,
  AnalyticsSummary,
  FunnelStep,
  RecentEventRow,
} from "@/types/analytics";

// ---------------------------------------------------------------------------
// Insert
// ---------------------------------------------------------------------------

export async function insertProductEvent(input: TrackEventInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return; // silently skip if DB not configured

  const { error } = await supabase.from("product_events").insert({
    user_id: input.userId ?? null,
    team_id: input.teamId ?? null,
    game_id: input.gameId ?? null,
    report_id: input.reportId ?? null,
    event_name: input.eventName,
    event_category: input.eventCategory,
    source: input.source ?? null,
    page_path: input.pagePath ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    // Swallow silently — analytics must never break product flows.
    console.warn("[analytics] Failed to insert product event:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Admin reads — all use service role; call site must gate by ADMIN_EMAILS
// ---------------------------------------------------------------------------

export async function getRecentProductEventsForAdmin(limit = 100): Promise<RecentEventRow[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("product_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[analytics] Failed to fetch product events:", error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    eventName: r.event_name as string,
    eventCategory: r.event_category as string,
    userId: (r.user_id as string | null) ?? null,
    teamId: (r.team_id as string | null) ?? null,
    gameId: (r.game_id as string | null) ?? null,
    reportId: (r.report_id as string | null) ?? null,
    source: (r.source as string | null) ?? null,
    pagePath: (r.page_path as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
  }));
}

export async function getAnalyticsSummaryForAdmin(): Promise<AnalyticsSummary> {
  const supabase = createServiceSupabaseClient();
  const zero: AnalyticsSummary = {
    totalUsers: 0,
    totalTeams: 0,
    totalGames: 0,
    totalReports: 0,
    totalShareLinks: 0,
    totalExports: 0,
    totalFeedback: 0,
    totalAccessRequests: 0,
    totalProductEvents: 0,
  };

  if (!supabase) return zero;

  // Run all count queries in parallel, swallow individual errors.
  const results = await Promise.allSettled([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("games").select("id", { count: "exact", head: true }),
    supabase.from("game_reports").select("id", { count: "exact", head: true }),
    supabase.from("share_links").select("id", { count: "exact", head: true }),
    supabase.from("export_records").select("id", { count: "exact", head: true }),
    supabase.from("product_feedback").select("id", { count: "exact", head: true }),
    supabase.from("access_requests").select("id", { count: "exact", head: true }),
    supabase.from("product_events").select("id", { count: "exact", head: true }),
  ]);

  function countOf(r: PromiseSettledResult<{ count: number | null }>): number {
    return r.status === "fulfilled" ? (r.value.count ?? 0) : 0;
  }

  return {
    totalUsers: countOf(results[0] as PromiseSettledResult<{ count: number | null }>),
    totalTeams: countOf(results[1] as PromiseSettledResult<{ count: number | null }>),
    totalGames: countOf(results[2] as PromiseSettledResult<{ count: number | null }>),
    totalReports: countOf(results[3] as PromiseSettledResult<{ count: number | null }>),
    totalShareLinks: countOf(results[4] as PromiseSettledResult<{ count: number | null }>),
    totalExports: countOf(results[5] as PromiseSettledResult<{ count: number | null }>),
    totalFeedback: countOf(results[6] as PromiseSettledResult<{ count: number | null }>),
    totalAccessRequests: countOf(results[7] as PromiseSettledResult<{ count: number | null }>),
    totalProductEvents: countOf(results[8] as PromiseSettledResult<{ count: number | null }>),
  };
}

export async function getFunnelSummaryForAdmin(): Promise<FunnelStep[]> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return FUNNEL_STEPS.map((s, i) => ({ ...s, step: i + 1, count: 0 }));
  }

  const steps = await Promise.allSettled(
    FUNNEL_STEPS.map((s) =>
      supabase
        .from("product_events")
        .select("id", { count: "exact", head: true })
        .eq("event_name", s.eventName)
    )
  );

  return FUNNEL_STEPS.map((s, i) => ({
    step: i + 1,
    label: s.label,
    eventName: s.eventName,
    count:
      steps[i].status === "fulfilled"
        ? ((steps[i] as PromiseFulfilledResult<{ count: number | null }>).value.count ?? 0)
        : 0,
  }));
}

// The canonical funnel — ordered steps a coach should progress through.
const FUNNEL_STEPS = [
  { label: "Landing / demo viewed", eventName: "landing_viewed" },
  { label: "Signed up / logged in", eventName: "login_completed" },
  { label: "Dashboard viewed", eventName: "dashboard_viewed" },
  { label: "Team created", eventName: "team_created" },
  { label: "Player added", eventName: "player_created" },
  { label: "Game created", eventName: "game_created" },
  { label: "Timestamp added", eventName: "timestamp_created" },
  { label: "Report generated", eventName: "analysis_completed" },
  { label: "Insight verified / edited", eventName: "insight_verified" },
  { label: "Report shared / exported", eventName: "share_link_created" },
];
