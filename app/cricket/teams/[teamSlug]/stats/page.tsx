import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart2, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getCricketTeamBySlug } from "@/lib/cricket/teams/queries";
import { getCricketPlayerStatsForTeam } from "@/lib/cricket/stats/queries";
import { getCricketTeamStanding } from "@/lib/cricket/standings/queries";
import type { CricketPlayerStatsWithPlayer } from "@/lib/cricket/types";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";

interface Props {
  params: Promise<{ teamSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) return { title: "Team not found — GameIQ" };
  return { title: `${team.name} — Stats — GameIQ` };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-sky-400">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function PlayerStatRow({ rank, player }: { rank: number; player: CricketPlayerStatsWithPlayer }) {
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3 text-slate-500 text-sm">{rank}</td>
      <td className="px-4 py-3">
        <Link
          href={`/cricket/players/${player.playerSlug ?? player.playerId}`}
          className="text-sm font-medium text-slate-200 hover:text-sky-400 transition-colors"
        >
          {player.playerName}
        </Link>
      </td>
      <td className="px-3 py-3 text-center text-slate-300">{player.matchesPlayed}</td>
      <td className="px-3 py-3 text-center font-bold text-sky-400">{player.runs}</td>
      <td className="px-3 py-3 text-center text-slate-300">
        {player.battingAverage != null ? player.battingAverage.toFixed(1) : "—"}
      </td>
      <td className="px-3 py-3 text-center font-bold text-emerald-400">{player.wickets}</td>
      <td className="px-3 py-3 text-center text-slate-300">
        {player.economyRate != null ? player.economyRate.toFixed(2) : "—"}
      </td>
      <td className="px-3 py-3 text-center text-slate-300">{player.catches}</td>
    </tr>
  );
}

export default async function TeamStatsPage({ params }: Props) {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) notFound();

  const playerStats = await getCricketPlayerStatsForTeam(team.id);

  // Attempt to find a standing for this team (try leagueId from team record)
  const standing = team.leagueId
    ? await getCricketTeamStanding(team.leagueId, team.id)
    : null;

  const topBatters = [...playerStats].sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topBowlers = [...playerStats].filter((p) => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 10);
  const bestEconomy = [...playerStats]
    .filter((p) => p.economyRate !== null && p.ballsBowled >= 6)
    .sort((a, b) => (a.economyRate ?? Infinity) - (b.economyRate ?? Infinity))
    .slice(0, 5);

  const nrrFormatted = standing
    ? (standing.netRunRate >= 0 ? `+${standing.netRunRate.toFixed(3)}` : standing.netRunRate.toFixed(3))
    : null;

  const formColors: Record<string, string> = {
    W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    L: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    T: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    NR: "bg-slate-700 text-slate-400 border-slate-600",
    A: "bg-slate-700 text-slate-500 border-slate-600",
  };

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <Link href={`/cricket/teams/${teamSlug}`} className="hover:text-slate-400 transition-colors">{team.name}</Link>
        <span>/</span>
        <span className="text-slate-400">Statistics</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div
          className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: team.primaryColor ?? "#334155" }}
        >
          {team.shortName?.slice(0, 3).toUpperCase() ?? team.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-0.5">{team.name}</h1>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Team Statistics
          </p>
        </div>
      </div>

      {/* Standing summary */}
      {standing ? (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">League Record</h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Position" value={standing.position ?? "—"} />
            <StatCard label="Points" value={standing.totalPoints} sub={`${standing.wins}W ${standing.losses}L ${standing.ties}T`} />
            <StatCard label="Matches Played" value={standing.matchesPlayed} />
            <StatCard label="NRR" value={nrrFormatted ?? "—"} />
          </div>

          {/* Runs / Wickets summary */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Runs For" value={standing.runsFor} />
            <StatCard label="Runs Against" value={standing.runsAgainst} />
            <StatCard label="Wickets Taken" value={standing.wicketsFor} />
            <StatCard label="Wickets Lost" value={standing.wicketsAgainst} />
          </div>

          {/* Form */}
          {standing.form.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Recent Form</h2>
              <div className="flex items-center gap-2">
                {standing.form.map((f, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-bold ${formColors[f] ?? "bg-slate-700 text-slate-400 border-slate-600"}`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-sm text-slate-400">No league standings data available for this team yet.</p>
          <p className="text-xs text-slate-500 mt-1">Rebuild standings from the league points table page.</p>
        </div>
      )}

      {/* Top batters */}
      {topBatters.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Top Run Scorers</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Player</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">M</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Runs</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Avg</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Wkts</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Econ</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ct</th>
                </tr>
              </thead>
              <tbody>
                {topBatters.map((p, i) => (
                  <PlayerStatRow key={p.id} rank={i + 1} player={p} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Player Statistics</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-8 text-center">
            <BarChart2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No player statistics yet.</p>
            <p className="text-xs text-slate-500 mt-1">Stats will appear after scorecards are completed and stats are rebuilt.</p>
          </div>
        </div>
      )}

      {/* Top bowlers */}
      {topBowlers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Top Wicket Takers</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topBowlers.slice(0, 5).map((p, i) => (
              <Link
                key={p.id}
                href={`/cricket/players/${p.playerSlug ?? p.playerId}`}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
              >
                <p className="text-xs text-slate-500 mb-1">#{i + 1}</p>
                <p className="text-sm font-semibold text-slate-200 truncate">{p.playerName}</p>
                <p className="text-xl font-bold text-emerald-400">{p.wickets}</p>
                <p className="text-xs text-slate-500">wickets</p>
                {p.economyRate != null && (
                  <p className="text-xs text-slate-400 mt-1">Econ {p.economyRate.toFixed(2)}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Best economy */}
      {bestEconomy.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Best Economy Rate</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {bestEconomy.map((p, i) => (
              <Link
                key={p.id}
                href={`/cricket/players/${p.playerSlug ?? p.playerId}`}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
              >
                <p className="text-xs text-slate-500 mb-1">#{i + 1}</p>
                <p className="text-sm font-semibold text-slate-200 truncate">{p.playerName}</p>
                <p className="text-xl font-bold text-sky-400">{p.economyRate?.toFixed(2)}</p>
                <p className="text-xs text-slate-500">economy</p>
                <p className="text-xs text-slate-400 mt-1">{ballsToOversText(p.ballsBowled)} ov</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Visual analytics placeholder */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Visual Analytics</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4">
          <p className="text-sm text-slate-400 mb-2">
            Per-match visual analytics (worm chart, Manhattan, run-rate graphs, wagon wheel) are available from individual match pages.
          </p>
          {team.leagueId && (
            <Link
              href={`/cricket/leagues/${encodeURIComponent(team.leagueId)}/analytics`}
              className="text-xs text-sky-400 hover:underline"
            >
              View League Analytics →
            </Link>
          )}
        </div>
      </div>

      {/* Nav links */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/cricket/teams/${teamSlug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Team Overview
        </Link>
        {standing && team.leagueId && (
          <>
            <Link href={`/cricket/leagues/${encodeURIComponent(team.leagueId)}/points-table`} className="text-slate-500 hover:text-slate-300 transition-colors">
              Points Table
            </Link>
            <Link href={`/cricket/leagues/${encodeURIComponent(team.leagueId)}/leaderboards`} className="text-slate-500 hover:text-slate-300 transition-colors">
              Leaderboards
            </Link>
            <Link href={`/cricket/leagues/${encodeURIComponent(team.leagueId)}/analytics`} className="text-slate-500 hover:text-slate-300 transition-colors">
              League Analytics
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
