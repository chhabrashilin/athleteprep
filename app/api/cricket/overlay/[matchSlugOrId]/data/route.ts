/**
 * GET /api/cricket/overlay/[matchSlugOrId]/data?token=<raw>&type=<overlayType>
 * Returns sanitized overlay data for the given match + token.
 * Used by overlay client components to poll for live updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateOverlayToken } from "@/lib/cricket/overlays/queries";
import {
  buildScorebugOverlayData,
  buildTossOverlayData,
  buildInningsBreakOverlayData,
  buildResultOverlayData,
  sanitizeOverlayData,
} from "@/lib/cricket/overlays/data";

interface RouteParams {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { matchSlugOrId } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const overlayType = req.nextUrl.searchParams.get("type") ?? "scorebug";

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Resolve match slug/id.
  const isUuid = /^[0-9a-f-]{36}$/i.test(matchSlugOrId);
  const matchQuery = isUuid
    ? supabase.from("cricket_matches").select("id, title, status, league_id, home_team_id, away_team_id, toss_won_by_team_id, toss_decision, result_summary, broadcast_status").eq("id", matchSlugOrId).maybeSingle()
    : supabase.from("cricket_matches").select("id, title, status, league_id, home_team_id, away_team_id, toss_won_by_team_id, toss_decision, result_summary, broadcast_status").eq("slug", matchSlugOrId).maybeSingle();

  const { data: match } = await matchQuery;
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Validate token.
  const validation = await validateOverlayToken(token, match.id);
  if (!validation.valid) {
    const messages = {
      not_found: "Overlay token not found",
      expired:   "Overlay token expired",
      revoked:   "Overlay token revoked",
      invalid:   "Invalid overlay token",
    };
    const msg = messages[validation.reason ?? "invalid"];
    return NextResponse.json({ error: msg, reason: validation.reason }, { status: 401 });
  }

  // Fetch supporting data.
  const [homeTeamResult, awayTeamResult, liveStateResult] = await Promise.all([
    supabase.from("cricket_teams").select("id, name, short_name").eq("id", match.home_team_id).maybeSingle(),
    supabase.from("cricket_teams").select("id, name, short_name").eq("id", match.away_team_id).maybeSingle(),
    supabase.from("cricket_live_match_state").select("*").eq("match_id", match.id).maybeSingle(),
  ]);

  const homeTeam = homeTeamResult.data;
  const awayTeam = awayTeamResult.data;
  const liveState = liveStateResult.data;

  const leagueName: string | null = null;

  // Build overlay data based on type.
  let overlayData: Record<string, unknown> = {};

  if (overlayType === "scorebug") {
    overlayData = buildScorebugOverlayData({
      matchTitle: match.title ?? `${homeTeam?.name ?? "Home"} vs ${awayTeam?.name ?? "Away"}`,
      leagueName,
      homeTeamName:      homeTeam?.name ?? "Home",
      homeTeamShortName: homeTeam?.short_name ?? null,
      homeTeamId:        match.home_team_id,
      awayTeamName:      awayTeam?.name ?? "Away",
      awayTeamShortName: awayTeam?.short_name ?? null,
      awayTeamId:        match.away_team_id,
      battingTeamId:     liveState?.batting_team_id ?? null,
      liveState: liveState ? {
        totalRuns:       liveState.total_runs ?? 0,
        wicketsLost:     liveState.wickets_lost ?? 0,
        oversText:       liveState.overs_text ?? "0.0",
        currentRunRate:  liveState.current_run_rate ?? null,
        requiredRunRate: liveState.required_run_rate ?? null,
        targetRuns:      liveState.target_runs ?? null,
        status:          liveState.status ?? "not_started",
        strikerId:       liveState.striker_id ?? null,
        nonStrikerId:    liveState.non_striker_id ?? null,
        bowlerId:        liveState.bowler_id ?? null,
      } : null,
      striker:      null,
      nonStriker:   null,
      bowler:       null,
      strikerRuns:  null,
      strikerBalls: null,
      nonStrikerRuns: null,
      nonStrikerBalls: null,
      bowlerWickets: null,
      bowlerRuns:    null,
      bowlerOvers:   null,
      lastBalls:     [],
    }) as unknown as Record<string, unknown>;
  } else if (overlayType === "toss") {
    overlayData = buildTossOverlayData({
      tossWonByTeamId: match.toss_won_by_team_id ?? null,
      tossDecision:    match.toss_decision ?? null,
      homeTeamName:    homeTeam?.name ?? "Home",
      homeTeamId:      match.home_team_id,
      awayTeamName:    awayTeam?.name ?? "Away",
      awayTeamId:      match.away_team_id,
      venueName:       null,
      matchTitle:      match.title ?? `${homeTeam?.name ?? "Home"} vs ${awayTeam?.name ?? "Away"}`,
    }) as unknown as Record<string, unknown>;
  } else {
    overlayData = {
      matchTitle: match.title,
      status:     match.status,
      broadcastStatus: match.broadcast_status,
    };
  }

  const sanitized = sanitizeOverlayData(overlayData);

  return NextResponse.json(
    { data: sanitized, matchStatus: match.status, broadcastStatus: match.broadcast_status },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Overlay-Match": match.id,
      },
    }
  );
}
