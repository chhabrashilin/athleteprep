import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy, RefreshCw, Info } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketLeagueStandingsBySlug, getStandingsRebuildSummary } from "@/lib/cricket/standings/queries";
import { RebuildStandingsButton } from "@/components/cricket/RebuildStandingsButton";
import type { CricketTeamStandingWithTeam, StandingsFormResult } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `Points Table — ${league.name} — GameIQ` };
}

function FormBadge({ result }: { result: StandingsFormResult }) {
  const colors: Record<StandingsFormResult, string> = {
    W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    L: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    T: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    NR: "bg-slate-700 text-slate-400 border-slate-600",
    A: "bg-slate-700 text-slate-500 border-slate-600",
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded border text-[10px] font-bold ${colors[result]}`}>
      {result}
    </span>
  );
}

function NrrDisplay({ nrr }: { nrr: number }) {
  const formatted = nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);
  const color = nrr > 0 ? "text-emerald-400" : nrr < 0 ? "text-rose-400" : "text-slate-400";
  return <span className={`font-mono text-xs ${color}`}>{formatted}</span>;
}

function PositionChange({ position, previous }: { position: number | null; previous: number | null }) {
  if (position === null || previous === null) return null;
  if (position < previous) return <span className="text-emerald-400 text-xs">↑</span>;
  if (position > previous) return <span className="text-rose-400 text-xs">↓</span>;
  return <span className="text-slate-600 text-xs">–</span>;
}

export default async function PointsTablePage({ params }: Props) {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const user = await getServerUser();
  const [canManage, standings, rebuildSummary] = await Promise.all([
    user ? userCanManageCricketLeague(user.id, league.id) : Promise.resolve(false),
    getCricketLeagueStandingsBySlug(slug),
    getStandingsRebuildSummary(league.id),
  ]);

  const lastCalculated = rebuildSummary.lastCalculatedAt
    ? new Date(rebuildSummary.lastCalculatedAt).toLocaleString()
    : null;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <Link href="/cricket/leagues" className="hover:text-slate-400 transition-colors">Leagues</Link>
        <span>/</span>
        <Link href={`/cricket/leagues/${slug}`} className="hover:text-slate-400 transition-colors">{league.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Points Table</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sky-400" />
            Points Table
          </h1>
          <p className="text-sm text-slate-400">
            {league.name}{league.seasonName ? ` — ${league.seasonName}` : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3 flex-wrap">
            {lastCalculated && (
              <span className="text-xs text-slate-500">
                Last rebuilt: {lastCalculated}
              </span>
            )}
            <RebuildStandingsButton leagueId={league.id} />
          </div>
        )}
      </div>

      {/* NRR explanation */}
      <div className="mb-5 flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3">
        <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          <span className="text-sky-400 font-medium">Net Run Rate (NRR)</span> = (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled).
          A positive NRR means your team scores faster than it concedes. When teams are level on points,
          the team with the higher NRR is ranked above.
        </p>
      </div>

      {standings.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
          <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300 mb-1">No standings yet</p>
          <p className="text-xs text-slate-500 mb-4">
            Complete matches and rebuild standings to populate the points table.
          </p>
          {canManage && (
            <div className="flex justify-center">
              <RebuildStandingsButton leagueId={league.id} variant="primary" />
            </div>
          )}
        </div>
      ) : (
        /* Points table — horizontal scroll on mobile */
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-8">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Team</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Matches played">P</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Won">W</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Lost">L</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Tied">T</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="No result">NR</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Points">Pts</th>
                {standings.some((s) => s.bonusPoints > 0) && (
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Bonus points">B</th>
                )}
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 font-bold" title="Total points">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Net Run Rate">NRR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.map((s: CricketTeamStandingWithTeam, idx) => (
                <tr
                  key={s.id}
                  className={`transition-colors hover:bg-slate-800/40 ${idx < 4 ? "bg-emerald-500/3" : ""}`}
                >
                  <td className="px-4 py-3 text-slate-400 text-sm w-8">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-300">{s.position ?? idx + 1}</span>
                      <PositionChange position={s.position} previous={s.previousPosition} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/cricket/teams/${s.teamSlug}`}
                      className="flex items-center gap-2.5 hover:text-sky-400 transition-colors group"
                    >
                      <div
                        className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: s.teamPrimaryColor ?? "#334155" }}
                      >
                        {s.teamShortName?.slice(0, 3).toUpperCase() ?? s.teamName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-sky-400 transition-colors truncate max-w-[160px]">
                        {s.teamName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-300">{s.matchesPlayed}</td>
                  <td className="px-3 py-3 text-center text-emerald-400 font-medium">{s.wins}</td>
                  <td className="px-3 py-3 text-center text-rose-400">{s.losses}</td>
                  <td className="px-3 py-3 text-center text-amber-400">{s.ties}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{s.noResults}</td>
                  <td className="px-3 py-3 text-center text-slate-300">{s.points}</td>
                  {standings.some((st) => st.bonusPoints > 0) && (
                    <td className="px-3 py-3 text-center text-slate-500">{s.bonusPoints}</td>
                  )}
                  <td className="px-3 py-3 text-center font-bold text-sky-400">{s.totalPoints}</td>
                  <td className="px-3 py-3 text-center">
                    <NrrDisplay nrr={s.netRunRate} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {s.form.length === 0 ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : (
                        s.form.map((f, i) => <FormBadge key={i} result={f as StandingsFormResult} />)
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin rebuild warning */}
      {canManage && standings.length === 0 && rebuildSummary.standingsCount === 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400">
            No completed matches found. Complete and finalize at least one match scorecard, then rebuild standings.
          </p>
        </div>
      )}

      {/* Nav links */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← League Overview
        </Link>
        <Link href={`/cricket/leagues/${slug}/schedule`} className="text-slate-500 hover:text-slate-300 transition-colors">
          Schedule
        </Link>
        <Link href={`/cricket/leagues/${slug}/leaderboards`} className="text-slate-500 hover:text-slate-300 transition-colors">
          Leaderboards
        </Link>
      </div>
    </AppShell>
  );
}
