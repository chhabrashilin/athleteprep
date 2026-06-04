import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import {
  getCricketBattingLeaderboard,
  getCricketBowlingLeaderboard,
  getCricketFieldingLeaderboard,
  getCricketAllRounderLeaderboard,
} from "@/lib/cricket/stats/queries";
import { getCricketLeagueStandings } from "@/lib/cricket/standings/queries";
import { RebuildPlayerStatsButton } from "@/components/cricket/RebuildPlayerStatsButton";
import type { CricketPlayerStatsWithPlayer, CricketTeamStandingWithTeam } from "@/lib/cricket/types";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `Leaderboards — ${league.name} — GameIQ` };
}

type Tab = "batting" | "bowling" | "fielding" | "allrounders" | "teams";

const TABS: { key: Tab; label: string }[] = [
  { key: "batting", label: "Batting" },
  { key: "bowling", label: "Bowling" },
  { key: "fielding", label: "Fielding" },
  { key: "allrounders", label: "All-rounders" },
  { key: "teams", label: "Team Stats" },
];

function StatCell({ value }: { value: number | null | undefined; }) {
  if (value == null) return <span className="text-slate-600">—</span>;
  return <span>{value}</span>;
}

function PlayerRow({
  rank, player, children,
}: {
  rank: number;
  player: CricketPlayerStatsWithPlayer;
  children: React.ReactNode;
}) {
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
        {player.teamName && (
          <p className="text-xs text-slate-500 mt-0.5">
            <Link href={`/cricket/teams/${player.teamSlug ?? player.teamId}`} className="hover:text-slate-400">
              {player.teamName}
            </Link>
          </p>
        )}
      </td>
      {children}
    </tr>
  );
}

function EmptyLeaderboard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-300 mb-1">No {label} data yet</p>
      <p className="text-xs text-slate-500">Complete scorecards and rebuild player stats to populate this leaderboard.</p>
    </div>
  );
}

function BattingTable({ players }: { players: CricketPlayerStatsWithPlayer[] }) {
  if (players.length === 0) return <EmptyLeaderboard label="batting" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Player</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Matches">M</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Innings">Inn</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Runs">Runs</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Highest score">HS</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Average">Avg</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Strike rate">SR</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Fours">4s</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Sixes">6s</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <PlayerRow key={p.id} rank={i + 1} player={p}>
              <td className="px-3 py-3 text-center text-slate-300">{p.matchesPlayed}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.inningsBatted}</td>
              <td className="px-3 py-3 text-center font-bold text-sky-400">{p.runs}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.highestScore}</td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.battingAverage != null ? p.battingAverage.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.battingStrikeRate != null ? p.battingStrikeRate.toFixed(1) : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-400">{p.fours}</td>
              <td className="px-3 py-3 text-center text-slate-400">{p.sixes}</td>
            </PlayerRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BowlingTable({ players }: { players: CricketPlayerStatsWithPlayer[] }) {
  if (players.length === 0) return <EmptyLeaderboard label="bowling" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Player</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">M</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Overs">Ov</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Wickets">Wkts</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Runs conceded">Runs</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Best bowling">Best</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Average">Avg</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Economy">Econ</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Maidens">Mdn</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <PlayerRow key={p.id} rank={i + 1} player={p}>
              <td className="px-3 py-3 text-center text-slate-300">{p.matchesPlayed}</td>
              <td className="px-3 py-3 text-center text-slate-300">{ballsToOversText(p.ballsBowled)}</td>
              <td className="px-3 py-3 text-center font-bold text-sky-400">{p.wickets}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.runsConceded}</td>
              <td className="px-3 py-3 text-center text-slate-300 font-mono text-xs">
                {p.bestBowlingWickets > 0 ? `${p.bestBowlingWickets}/${p.bestBowlingRuns ?? "?"}` : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.bowlingAverage != null ? p.bowlingAverage.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.economyRate != null ? p.economyRate.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-400">{p.maidens}</td>
            </PlayerRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldingTable({ players }: { players: CricketPlayerStatsWithPlayer[] }) {
  if (players.length === 0) return <EmptyLeaderboard label="fielding" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Player</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">M</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Catches">Ct</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Stumpings">St</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Run outs">RO</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Total dismissals">Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <PlayerRow key={p.id} rank={i + 1} player={p}>
              <td className="px-3 py-3 text-center text-slate-300">{p.matchesPlayed}</td>
              <td className="px-3 py-3 text-center font-bold text-sky-400">{p.catches}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.stumpings}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.runOuts}</td>
              <td className="px-3 py-3 text-center text-slate-300">{p.catches + p.stumpings + p.runOuts}</td>
            </PlayerRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllRoundersTable({ players }: { players: CricketPlayerStatsWithPlayer[] }) {
  if (players.length === 0) return <EmptyLeaderboard label="all-rounder" />;
  return (
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
          {players.map((p, i) => (
            <PlayerRow key={p.id} rank={i + 1} player={p}>
              <td className="px-3 py-3 text-center text-slate-300">{p.matchesPlayed}</td>
              <td className="px-3 py-3 text-center font-medium text-sky-400">{p.runs}</td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.battingAverage != null ? p.battingAverage.toFixed(1) : "—"}
              </td>
              <td className="px-3 py-3 text-center font-medium text-emerald-400">{p.wickets}</td>
              <td className="px-3 py-3 text-center text-slate-300">
                {p.economyRate != null ? p.economyRate.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-3 text-center text-slate-300">{p.catches}</td>
            </PlayerRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamStatsTable({ standings }: { standings: CricketTeamStandingWithTeam[] }) {
  if (standings.length === 0) return <EmptyLeaderboard label="team stats" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Team</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Pts</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500" title="Net Run Rate">NRR</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Runs For</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Runs Against</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Wkts For</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Wkts Against</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/cricket/teams/${s.teamSlug}/stats`} className="flex items-center gap-2 hover:text-sky-400 transition-colors">
                  <div
                    className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: s.teamPrimaryColor ?? "#334155" }}
                  >
                    {s.teamShortName?.slice(0, 3).toUpperCase() ?? s.teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-200">{s.teamName}</span>
                </Link>
              </td>
              <td className="px-3 py-3 text-center font-bold text-sky-400">{s.totalPoints}</td>
              <td className="px-3 py-3 text-center">
                <span className={`font-mono text-xs ${s.netRunRate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {s.netRunRate >= 0 ? "+" : ""}{s.netRunRate.toFixed(3)}
                </span>
              </td>
              <td className="px-3 py-3 text-center text-slate-300">{s.runsFor}</td>
              <td className="px-3 py-3 text-center text-slate-300">{s.runsAgainst}</td>
              <td className="px-3 py-3 text-center text-slate-300">{s.wicketsFor}</td>
              <td className="px-3 py-3 text-center text-slate-300">{s.wicketsAgainst}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LeaderboardsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const activeTab: Tab = (["batting", "bowling", "fielding", "allrounders", "teams"].includes(rawTab ?? "")) ? (rawTab as Tab) : "batting";

  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const user = await getServerUser();
  const canManage = user ? await userCanManageCricketLeague(user.id, league.id) : false;

  const [batting, bowling, fielding, allRounders, standings] = await Promise.all([
    getCricketBattingLeaderboard(league.id, { limit: 50 }),
    getCricketBowlingLeaderboard(league.id, { limit: 50 }),
    getCricketFieldingLeaderboard(league.id, { limit: 50 }),
    getCricketAllRounderLeaderboard(league.id, { limit: 50 }),
    getCricketLeagueStandings(league.id),
  ]);

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
        <span className="text-slate-400">Leaderboards</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-sky-400" />
            Leaderboards
          </h1>
          <p className="text-sm text-slate-400">
            {league.name}{league.seasonName ? ` — ${league.seasonName}` : ""}
          </p>
        </div>
        {canManage && (
          <RebuildPlayerStatsButton leagueId={league.id} />
        )}
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/cricket/leagues/${slug}/leaderboards?tab=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      {activeTab === "batting" && <BattingTable players={batting} />}
      {activeTab === "bowling" && <BowlingTable players={bowling} />}
      {activeTab === "fielding" && <FieldingTable players={fielding} />}
      {activeTab === "allrounders" && <AllRoundersTable players={allRounders} />}
      {activeTab === "teams" && <TeamStatsTable standings={standings} />}

      {/* Empty state prompt for admin */}
      {canManage && batting.length === 0 && activeTab === "batting" && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400">
            No player stats yet. Complete scorecards and click &quot;Rebuild Player Stats&quot; to generate leaderboards.
          </p>
        </div>
      )}

      {/* Nav links */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300 transition-colors">← League Overview</Link>
        <Link href={`/cricket/leagues/${slug}/points-table`} className="text-slate-500 hover:text-slate-300 transition-colors">Points Table</Link>
        <Link href={`/cricket/leagues/${slug}/schedule`} className="text-slate-500 hover:text-slate-300 transition-colors">Schedule</Link>
      </div>
    </AppShell>
  );
}
