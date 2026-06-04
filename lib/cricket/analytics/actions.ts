"use server";

/**
 * lib/cricket/analytics/actions.ts
 * Server actions for generating analytics snapshots.
 */

import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { generateSnapshotSchema, type GenerateSnapshotInput } from "@/lib/cricket/validation/analytics";
import {
  buildWormChartData,
  buildManhattanChartData,
  buildRunRateGraphData,
  buildPartnershipChartData,
  buildWagonWheelData,
  buildPhaseSummary,
  buildMatchMomentumData,
  summarizeMatchAnalytics,
} from "./chart-data";
import { getMatchAnalyticsData } from "./queries";
import type { InningsInfo, PartnershipInput } from "./chart-data";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export async function generateMatchAnalyticsSnapshot(
  rawInput: GenerateSnapshotInput
): Promise<ActionResult<{ id: string; snapshotType: string }>> {
  const user = await getServerUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = generateSnapshotSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { success: false, error: "Database unavailable" };

  const canManage = await supabase.rpc("user_can_manage_cricket_match", {
    _match_id: input.matchId,
    _user_id: user.id,
  });
  if (!canManage.data) return { success: false, error: "Not authorized" };

  const bundle = await getMatchAnalyticsData(input.matchId);
  if (!bundle.match) return { success: false, error: "Match not found" };

  const innings: InningsInfo[] = bundle.innings.map((i) => ({
    id: i.id,
    battingTeamId: i.battingTeamId,
    inningsNumber: i.inningsNumber,
    totalRuns: i.totalRuns,
    wicketsLost: i.wicketsLost,
    ballsBowled: i.ballsBowled,
  }));

  const partnerships: PartnershipInput[] = bundle.partnerships.map((p) => ({
    wicketNumber: p.wicketNumber,
    runs: p.runs,
    balls: p.balls,
    startScore: p.startScore,
    endScore: p.endScore,
    playerOneName: "Player",
    playerTwoName: "Player",
  }));

  let chartData: Record<string, unknown> = {};

  switch (input.snapshotType) {
    case "worm_chart":
      chartData = { points: buildWormChartData(bundle.ballEvents, innings) };
      break;
    case "manhattan_chart":
      chartData = { bars: buildManhattanChartData(bundle.ballEvents) };
      break;
    case "run_rate_graph":
      chartData = { points: buildRunRateGraphData(bundle.ballEvents, innings, bundle.match.targetRuns ?? undefined) };
      break;
    case "wagon_wheel":
      chartData = buildWagonWheelData(bundle.ballEvents) as unknown as Record<string, unknown>;
      break;
    case "partnerships":
      chartData = { partnerships: buildPartnershipChartData(partnerships) };
      break;
    case "momentum":
      chartData = { points: buildMatchMomentumData(bundle.ballEvents, innings) };
      break;
    case "phase_summary":
      chartData = { phases: buildPhaseSummary(bundle.ballEvents) };
      break;
    case "full_match_analytics": {
      const manhattan = buildManhattanChartData(bundle.ballEvents);
      const partnershipRows = buildPartnershipChartData(partnerships);
      const phases = buildPhaseSummary(bundle.ballEvents);
      chartData = {
        worm: buildWormChartData(bundle.ballEvents, innings),
        manhattan,
        runRate: buildRunRateGraphData(bundle.ballEvents, innings, bundle.match.targetRuns ?? undefined),
        wagonWheel: buildWagonWheelData(bundle.ballEvents),
        partnerships: partnershipRows,
        phases,
        momentum: buildMatchMomentumData(bundle.ballEvents, innings),
        summary: summarizeMatchAnalytics({ manhattan, partnerships: partnershipRows, phases }),
      };
      break;
    }
  }

  const { data, error } = await supabase
    .from("cricket_match_analytics_snapshots")
    .insert({
      match_id: input.matchId,
      league_id: bundle.match.leagueId,
      snapshot_type: input.snapshotType,
      generated_by: user.id,
      data: chartData,
      summary: { generatedAt: new Date().toISOString(), hasBallByBallData: bundle.hasBallByBallData },
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id, snapshotType: input.snapshotType } };
}

export async function generateFullMatchAnalyticsSnapshot(
  matchId: string
): Promise<ActionResult<{ id: string }>> {
  return generateMatchAnalyticsSnapshot({ matchId, snapshotType: "full_match_analytics" });
}
