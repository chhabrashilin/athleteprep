import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchWithTeams } from "@/lib/cricket/matches/queries";
import { getMatchAnalyticsData } from "@/lib/cricket/analytics/queries";
import {
  buildWormChartData,
  buildManhattanChartData,
  buildRunRateGraphData,
  buildPartnershipChartData,
  buildWagonWheelData,
  buildPhaseSummary,
  buildMatchMomentumData,
  summarizeMatchAnalytics,
} from "@/lib/cricket/analytics/chart-data";
import { WormChart } from "@/components/cricket/charts/WormChart";
import { ManhattanChart } from "@/components/cricket/charts/ManhattanChart";
import { RunRateChart } from "@/components/cricket/charts/RunRateChart";
import { PartnershipChart } from "@/components/cricket/charts/PartnershipChart";
import { WagonWheelChart } from "@/components/cricket/charts/WagonWheelChart";
import { PhaseSummaryCards } from "@/components/cricket/charts/PhaseSummaryCards";
import { MatchMomentumChart } from "@/components/cricket/charts/MatchMomentumChart";
import { AnalyticsInsightCard } from "@/components/cricket/charts/AnalyticsInsightCard";
import { CricketChartCard } from "@/components/cricket/charts/CricketChartCard";
import type { InningsInfo, PartnershipInput } from "@/lib/cricket/analytics/chart-data";
import type { CricketInnings, CricketPartnership } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId);
  if (!match) return { title: "Match not found — GameIQ" };
  const home = match.homeTeam?.name ?? "Home";
  const away = match.awayTeam?.name ?? "Away";
  return { title: `Analytics — ${home} vs ${away} — GameIQ` };
}

type Tab = "summary" | "worm" | "manhattan" | "runrate" | "partnerships" | "wagon" | "momentum";
const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "worm", label: "Worm" },
  { key: "manhattan", label: "Manhattan" },
  { key: "runrate", label: "Run Rate" },
  { key: "partnerships", label: "Partnerships" },
  { key: "wagon", label: "Wagon Wheel" },
  { key: "momentum", label: "Momentum" },
];

export default async function MatchAnalyticsPage({ params, searchParams }: Props) {
  const { matchSlugOrId } = await params;
  const { tab: rawTab } = await searchParams;
  const activeTab: Tab = (["summary", "worm", "manhattan", "runrate", "partnerships", "wagon", "momentum"].includes(rawTab ?? ""))
    ? rawTab as Tab
    : "summary";

  const matchWithTeams = await getCricketMatchWithTeams(matchSlugOrId);
  if (!matchWithTeams) notFound();

  const matchId = matchWithTeams.id;
  const bundle = await getMatchAnalyticsData(matchId);

  const innings: InningsInfo[] = (bundle.innings as CricketInnings[]).map((i) => ({
    id: i.id,
    battingTeamId: i.battingTeamId,
    inningsNumber: i.inningsNumber,
    totalRuns: i.totalRuns,
    wicketsLost: i.wicketsLost,
    ballsBowled: i.ballsBowled,
  }));

  const partnerships: PartnershipInput[] = (bundle.partnerships as CricketPartnership[]).map((p) => ({
    wicketNumber: p.wicketNumber,
    runs: p.runs,
    balls: p.balls,
    startScore: p.startScore,
    endScore: p.endScore,
    playerOneName: bundle.battingEntries.find((e) => e.playerId === p.playerOneId)?.playerName ?? "Batter 1",
    playerTwoName: bundle.battingEntries.find((e) => e.playerId === p.playerTwoId)?.playerName ?? "Batter 2",
  }));

  const teamNames: Record<string, string> = {};
  if (matchWithTeams.homeTeam && matchWithTeams.homeTeamId) {
    teamNames[matchWithTeams.homeTeamId] = matchWithTeams.homeTeam.name;
  }
  if (matchWithTeams.awayTeam && matchWithTeams.awayTeamId) {
    teamNames[matchWithTeams.awayTeamId] = matchWithTeams.awayTeam.name;
  }

  // Build all chart data
  const wormPoints = buildWormChartData(bundle.ballEvents, innings);
  const manhattanBars = buildManhattanChartData(bundle.ballEvents);
  const runRatePoints = buildRunRateGraphData(bundle.ballEvents, innings, matchWithTeams.targetRuns ?? undefined);
  const partnershipRows = buildPartnershipChartData(partnerships);
  const wagonData = buildWagonWheelData(bundle.ballEvents);
  const phaseData = buildPhaseSummary(bundle.ballEvents);
  const momentumData = buildMatchMomentumData(bundle.ballEvents, innings);
  const analyticsSummary = summarizeMatchAnalytics({ manhattan: manhattanBars, partnerships: partnershipRows, phases: phaseData });

  const home = matchWithTeams.homeTeam?.name ?? "Home";
  const away = matchWithTeams.awayTeam?.name ?? "Away";

  const matchSlug = matchWithTeams.leagueSlug ?? matchWithTeams.leagueId;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="hover:text-slate-400">
          {home} vs {away}
        </Link>
        <span>/</span>
        <span className="text-slate-400">Analytics</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-sky-400" />
            Match Analytics
          </h1>
          <p className="text-sm text-slate-400">{home} vs {away}</p>
          {!bundle.hasBallByBallData && (
            <p className="mt-2 text-xs text-amber-400 rounded bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 inline-block">
              Advanced charts require ball-by-ball scoring data. Manual scorecard data can still show basic partnerships and innings summaries.
            </p>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/cricket/matches/${matchSlugOrId}/analytics?tab=${t.key}`}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-5">
        {activeTab === "summary" && (
          <>
            <AnalyticsInsightCard summary={analyticsSummary} />
            <CricketChartCard title="Phase Summary" description="Runs, wickets, and run rate by phase">
              <PhaseSummaryCards phases={phaseData} />
            </CricketChartCard>
            {/* Innings totals */}
            {bundle.innings.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Innings Summary</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(bundle.innings as CricketInnings[]).map((inn, i) => {
                    const teamName = teamNames[inn.battingTeamId] ?? `Team ${i + 1}`;
                    return (
                      <div key={inn.id} className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Innings {inn.inningsNumber}</p>
                        <p className="text-sm font-semibold text-slate-200">{teamName}</p>
                        <p className="text-2xl font-bold text-sky-400 mt-1">
                          {inn.totalRuns}/{inn.wicketsLost}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{inn.oversText ?? `${Math.floor(inn.ballsBowled / 6)}.${inn.ballsBowled % 6} overs`}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "worm" && (
          <CricketChartCard title="Worm Chart" description="Cumulative run progression per innings">
            <WormChart points={wormPoints} teamNames={teamNames} />
          </CricketChartCard>
        )}

        {activeTab === "manhattan" && (
          <CricketChartCard title="Manhattan Chart" description="Runs scored per over (• = wicket)">
            <ManhattanChart bars={manhattanBars} teamNames={teamNames} />
          </CricketChartCard>
        )}

        {activeTab === "runrate" && (
          <CricketChartCard title="Run Rate Graph" description="Current run rate vs required run rate">
            <RunRateChart points={runRatePoints} showRequired={matchWithTeams.targetRuns !== null} />
          </CricketChartCard>
        )}

        {activeTab === "partnerships" && (
          <CricketChartCard title="Partnerships" description="Run contributions by batting pairs">
            <PartnershipChart partnerships={partnershipRows} />
          </CricketChartCard>
        )}

        {activeTab === "wagon" && (
          <CricketChartCard
            title="Wagon Wheel"
            description="Shot zone distribution"
            badge={wagonData.hasShotCoordinates ? undefined : "Zone summary only"}
          >
            <WagonWheelChart data={wagonData} />
          </CricketChartCard>
        )}

        {activeTab === "momentum" && (
          <CricketChartCard title="Match Momentum" description="Over-by-over momentum shift" badge="Experimental">
            <MatchMomentumChart
              points={momentumData}
              battingTeamName={matchWithTeams.homeTeam?.name}
              bowlingTeamName={matchWithTeams.awayTeam?.name}
            />
          </CricketChartCard>
        )}
      </div>

      {/* Nav links */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="text-slate-500 hover:text-slate-300">← Match</Link>
        <Link href={`/cricket/matches/${matchSlugOrId}/scorecard`} className="text-slate-500 hover:text-slate-300">Scorecard</Link>
        {matchSlug && (
          <Link href={`/cricket/leagues/${matchSlug}/analytics`} className="text-slate-500 hover:text-slate-300">League Analytics</Link>
        )}
      </div>
    </AppShell>
  );
}
