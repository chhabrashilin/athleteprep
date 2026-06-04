/**
 * lib/cricket/overlays/server.ts
 * Server-side helper: fetch + validate token, return match + overlay data.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateOverlayToken } from "./queries";
import type { TokenValidationResult } from "./queries";

export interface OverlayPageData {
  valid: true;
  matchId: string;
  matchTitle: string;
  leagueName: string | null;
  homeTeamName: string;
  homeTeamId: string;
  awayTeamName: string;
  awayTeamId: string;
  matchStatus: string;
  broadcastStatus: string;
  tossWonByTeamId: string | null;
  tossDecision: string | null;
  venueName: string | null;
  liveState: {
    totalRuns: number;
    wicketsLost: number;
    oversText: string;
    currentRunRate: number | null;
    requiredRunRate: number | null;
    targetRuns: number | null;
    status: string;
    strikerId: string | null;
    nonStrikerId: string | null;
    bowlerId: string | null;
  } | null;
}

export type OverlayPageResult =
  | OverlayPageData
  | { valid: false; reason: TokenValidationResult["reason"] };

export async function fetchOverlayPageData(
  matchSlugOrId: string,
  rawToken: string | null
): Promise<OverlayPageResult> {
  if (!rawToken) return { valid: false, reason: "not_found" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { valid: false, reason: "not_found" };

  const isUuid = /^[0-9a-f-]{36}$/i.test(matchSlugOrId);
  const { data: match } = isUuid
    ? await supabase
        .from("cricket_matches")
        .select("id, title, slug, status, broadcast_status, league_id, home_team_id, away_team_id, toss_won_by_team_id, toss_decision, venue_id")
        .eq("id", matchSlugOrId)
        .maybeSingle()
    : await supabase
        .from("cricket_matches")
        .select("id, title, slug, status, broadcast_status, league_id, home_team_id, away_team_id, toss_won_by_team_id, toss_decision, venue_id")
        .eq("slug", matchSlugOrId)
        .maybeSingle();

  if (!match) return { valid: false, reason: "not_found" };

  const validation = await validateOverlayToken(rawToken, match.id);
  if (!validation.valid) return { valid: false, reason: validation.reason };

  const [homeResult, awayResult, liveResult, venueResult] = await Promise.all([
    supabase.from("cricket_teams").select("id, name, short_name").eq("id", match.home_team_id).maybeSingle(),
    supabase.from("cricket_teams").select("id, name, short_name").eq("id", match.away_team_id).maybeSingle(),
    supabase.from("cricket_live_match_state").select("*").eq("match_id", match.id).maybeSingle(),
    match.venue_id
      ? supabase.from("cricket_venues").select("name").eq("id", match.venue_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const liveRow = liveResult.data;

  return {
    valid: true,
    matchId: match.id,
    matchTitle: match.title ?? `${homeResult.data?.name ?? "Home"} vs ${awayResult.data?.name ?? "Away"}`,
    leagueName: null,
    homeTeamName:   homeResult.data?.name ?? "Home",
    homeTeamId:     match.home_team_id,
    awayTeamName:   awayResult.data?.name ?? "Away",
    awayTeamId:     match.away_team_id,
    matchStatus:    match.status ?? "scheduled",
    broadcastStatus: match.broadcast_status ?? "not_configured",
    tossWonByTeamId: match.toss_won_by_team_id ?? null,
    tossDecision:    match.toss_decision ?? null,
    venueName:       venueResult.data?.name ?? null,
    liveState: liveRow ? {
      totalRuns:       liveRow.total_runs ?? 0,
      wicketsLost:     liveRow.wickets_lost ?? 0,
      oversText:       liveRow.overs_text ?? "0.0",
      currentRunRate:  liveRow.current_run_rate ?? null,
      requiredRunRate: liveRow.required_run_rate ?? null,
      targetRuns:      liveRow.target_runs ?? null,
      status:          liveRow.status ?? "not_started",
      strikerId:       liveRow.striker_id ?? null,
      nonStrikerId:    liveRow.non_striker_id ?? null,
      bowlerId:        liveRow.bowler_id ?? null,
    } : null,
  };
}
