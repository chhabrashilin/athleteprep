import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getCricketLeagueBySlugFull } from "@/lib/cricket/leagues/queries";
import { getLeagueMatchesForAnalytics } from "@/lib/cricket/analytics/queries";
import { getCricketLeagueStandings } from "@/lib/cricket/standings/queries";
import { ChartEmptyState } from "@/components/cricket/charts/ChartEmptyState";
import { CricketChartCard } from "@/components/cricket/charts/CricketChartCard";
import type { CricketTeamStandingWithTeam } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `Analytics — ${league.name} — GameIQ` };
}

export default async function LeagueAnalyticsPage({ params }: Props) {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const [matchStats, standings] = await Promise.all([
    getLeagueMatchesForAnalytics(league.id).catch(() => []),
    getCricketLeagueStandings(league.id).catch(() => []),
  ]);

  const totalMatches = matchStats.length;
  const bbMatches = matchStats.filter((m) => m.hasBallByBallData).length;
  const hasBBData = bbMatches > 0;

  const completedMatches = matchStats.filter((m) => m.matchStatus === "completed");

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400">{league.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Analytics</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-sky-400" />
          League Analytics
        </h1>
        <p className="text-sm text-slate-400">
          {league.name}{league.seasonName ? ` — ${league.seasonName}` : ""}
        </p>
      </div>

      {/* Coverage summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Matches</p>
          <p className="text-2xl font-bold text-sky-400">{totalMatches}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-sky-400">{completedMatches.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ball-by-Ball</p>
          <p className="text-2xl font-bold text-emerald-400">{bbMatches}</p>
          <p className="text-xs text-slate-500 mt-0.5">of {totalMatches} matches</p>
        </div>
      </div>

      {!hasBBData ? (
        <ChartEmptyState
          title="No ball-by-ball data yet"
          message="League analytics will appear after ball-by-ball matches are completed."
          hint="Use the live scoring tool for individual matches to unlock advanced analytics."
        />
      ) : (
        <>
          {/* Team run-rate profiles from standings */}
          {standings.length > 0 && (
            <CricketChartCard title="Team Run-Rate Profiles" description="NRR and scoring data per team">
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="text-left pb-2 pr-3">Team</th>
                      <th className="text-right pb-2 pr-3">Matches</th>
                      <th className="text-right pb-2 pr-3">Runs For</th>
                      <th className="text-right pb-2 pr-3">Runs Against</th>
                      <th className="text-right pb-2 pr-3">Wkts For</th>
                      <th className="text-right pb-2">NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(standings as CricketTeamStandingWithTeam[]).map((s) => (
                      <tr key={s.id} className="border-b border-slate-800/40 text-slate-300">
                        <td className="py-1.5 pr-3">
                          <Link href={`/cricket/teams/${s.teamSlug}/stats`} className="hover:text-sky-400">
                            {s.teamName}
                          </Link>
                        </td>
                        <td className="py-1.5 pr-3 text-right">{s.matchesPlayed}</td>
                        <td className="py-1.5 pr-3 text-right font-medium">{s.runsFor}</td>
                        <td className="py-1.5 pr-3 text-right">{s.runsAgainst}</td>
                        <td className="py-1.5 pr-3 text-right">{s.wicketsFor}</td>
                        <td className={`py-1.5 text-right font-mono ${s.netRunRate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {s.netRunRate >= 0 ? "+" : ""}{s.netRunRate.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CricketChartCard>
          )}

          {/* Match analytics links */}
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Per-Match Analytics</h2>
            <div className="space-y-2">
              {matchStats
                .filter((m) => m.hasBallByBallData)
                .map((m) => (
                  <Link
                    key={m.id}
                    href={`/cricket/matches/${m.id}/analytics`}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
                  >
                    <span className="text-sm font-medium text-slate-200">Match {m.id.slice(0, 8)}…</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5">Ball-by-ball</span>
                      <span className="text-sky-400 text-xs">View →</span>
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Nav links */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300">← League Overview</Link>
        <Link href={`/cricket/leagues/${slug}/points-table`} className="text-slate-500 hover:text-slate-300">Points Table</Link>
        <Link href={`/cricket/leagues/${slug}/leaderboards`} className="text-slate-500 hover:text-slate-300">Leaderboards</Link>
        <Link href={`/cricket/leagues/${slug}/schedule`} className="text-slate-500 hover:text-slate-300">Schedule</Link>
      </div>
    </AppShell>
  );
}
