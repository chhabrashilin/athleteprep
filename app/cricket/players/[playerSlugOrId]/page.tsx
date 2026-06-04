import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, User } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketPlayerBySlug, getCricketPlayerById, getCricketTeamsForPlayer } from "@/lib/cricket/players/queries";
import { getCricketPlayerStats } from "@/lib/cricket/stats/queries";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";
import type { CricketPlayerFull } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ playerSlugOrId: string }>;
}

const BATTING_DISPLAY: Record<string, string> = {
  right_hand_bat: "Right-hand bat",
  left_hand_bat: "Left-hand bat",
  unknown: "Unknown",
};

const BOWLING_DISPLAY: Record<string, string> = {
  right_arm_fast: "Right-arm fast",
  right_arm_medium: "Right-arm medium",
  right_arm_spin: "Right-arm spin",
  left_arm_fast: "Left-arm fast",
  left_arm_medium: "Left-arm medium",
  left_arm_spin: "Left-arm spin",
  wicketkeeper: "Wicketkeeper",
  none: "None",
  unknown: "Unknown",
};

const ROLE_DISPLAY: Record<string, string> = {
  batter: "Batter",
  bowler: "Bowler",
  all_rounder: "All-rounder",
  wicketkeeper: "Wicketkeeper",
  captain: "Captain",
  coach: "Coach",
  unknown: "Unknown",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlugOrId } = await params;
  let player: CricketPlayerFull | null = null;

  // Try slug first, fall back to UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerSlugOrId);
  if (isUUID) {
    player = await getCricketPlayerById(playerSlugOrId);
  } else {
    player = await getCricketPlayerBySlug(playerSlugOrId);
  }

  if (!player) return { title: "Player not found — GameIQ" };
  return { title: `${player.displayName} — GameIQ` };
}

export default async function CricketPlayerPage({ params }: Props) {
  const { playerSlugOrId } = await params;

  let player: CricketPlayerFull | null = null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerSlugOrId);

  if (isUUID) {
    player = await getCricketPlayerById(playerSlugOrId);
  } else {
    player = await getCricketPlayerBySlug(playerSlugOrId);
  }

  if (!player) notFound();

  const user = await getServerUser();
  const canEdit = user ? (user.id === player.createdBy || user.id === player.userId) : false;

  const [teams, allStats] = await Promise.all([
    getCricketTeamsForPlayer(player.id),
    getCricketPlayerStats(player.id).catch(() => []),
  ]);

  // Aggregate totals across all leagues
  const aggStats = allStats.reduce(
    (acc, s) => ({
      matchesPlayed: acc.matchesPlayed + s.matchesPlayed,
      inningsBatted: acc.inningsBatted + s.inningsBatted,
      runs: acc.runs + s.runs,
      ballsFaced: acc.ballsFaced + s.ballsFaced,
      fours: acc.fours + s.fours,
      sixes: acc.sixes + s.sixes,
      highestScore: Math.max(acc.highestScore, s.highestScore),
      ducks: acc.ducks + s.ducks,
      fifties: acc.fifties + s.fifties,
      hundreds: acc.hundreds + s.hundreds,
      inningsBowled: acc.inningsBowled + s.inningsBowled,
      ballsBowled: acc.ballsBowled + s.ballsBowled,
      runsConceded: acc.runsConceded + s.runsConceded,
      wickets: acc.wickets + s.wickets,
      maidens: acc.maidens + s.maidens,
      catches: acc.catches + s.catches,
      stumpings: acc.stumpings + s.stumpings,
      runOuts: acc.runOuts + s.runOuts,
      notOuts: acc.notOuts + s.notOuts,
    }),
    {
      matchesPlayed: 0, inningsBatted: 0, runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
      highestScore: 0, ducks: 0, fifties: 0, hundreds: 0, inningsBowled: 0, ballsBowled: 0,
      runsConceded: 0, wickets: 0, maidens: 0, catches: 0, stumpings: 0, runOuts: 0, notOuts: 0,
    }
  );

  const outs = aggStats.inningsBatted - aggStats.notOuts;
  const battingAvg = outs > 0 ? (aggStats.runs / outs).toFixed(2) : null;
  const battingStrikeRate = aggStats.ballsFaced > 0 ? ((aggStats.runs / aggStats.ballsFaced) * 100).toFixed(1) : null;
  const bowlingAvg = aggStats.wickets > 0 ? (aggStats.runsConceded / aggStats.wickets).toFixed(2) : null;
  const economyRate = aggStats.ballsBowled > 0 ? ((aggStats.runsConceded / aggStats.ballsBowled) * 6).toFixed(2) : null;
  const hasStats = allStats.length > 0;

  const initials = player.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = player.primaryRole
    ? (ROLE_DISPLAY[player.primaryRole] ?? player.primaryRole)
    : player.role ?? null;

  const battingLabel = player.battingStyle ? (BATTING_DISPLAY[player.battingStyle] ?? player.battingStyle) : null;
  const bowlingLabel = player.bowlingStyle ? (BOWLING_DISPLAY[player.bowlingStyle] ?? player.bowlingStyle) : null;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">Cricket Hub</Link>
        <span>/</span>
        <span className="text-slate-400">{player.displayName}</span>
      </div>

      {/* Hero */}
      <div className="mb-6 flex items-start gap-5 flex-wrap">
        <div className="h-16 w-16 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200">
          {player.profilePhotoUrl ? (
            <img src={player.profilePhotoUrl} alt={player.displayName} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-0.5">{player.displayName}</h1>
              {role && <p className="text-sm text-slate-400">{role}</p>}
              {player.userId && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-400">
                  <User className="h-3 w-3" />
                  Verified account
                </span>
              )}
            </div>
            {canEdit && (
              <Link
                href={`/cricket/players/${playerSlugOrId}/edit`}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all"
              >
                Edit Profile
              </Link>
            )}
          </div>
          {player.bio && (
            <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-2xl">{player.bio}</p>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {battingLabel && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Batting style</p>
            <p className="text-sm font-semibold text-slate-200">{battingLabel}</p>
          </div>
        )}
        {bowlingLabel && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bowling style</p>
            <p className="text-sm font-semibold text-slate-200">{bowlingLabel}</p>
          </div>
        )}
        {(player.city || player.country) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {[player.city, player.country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
        {player.dominantHand && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dominant hand</p>
            <p className="text-sm font-semibold text-slate-200 capitalize">{player.dominantHand.replace("_", " ")}</p>
          </div>
        )}
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Teams</h2>
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/cricket/teams/${team.slug}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 hover:border-sky-500/40 hover:bg-slate-800/60 transition-all"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: team.primaryColor ?? "#334155" }}
                >
                  {team.shortName?.slice(0, 3).toUpperCase() ?? team.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-slate-200">{team.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Player statistics */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Player statistics</h2>
        {!hasStats ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-6 text-center">
            <p className="text-sm text-slate-400">Stats will appear after scorecards are completed.</p>
            <p className="text-xs text-slate-500 mt-1">Ask a league admin to rebuild player statistics.</p>
          </div>
        ) : (
          <>
            {/* Career overview */}
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Matches</p>
                <p className="text-xl font-bold text-sky-400">{aggStats.matchesPlayed}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Runs</p>
                <p className="text-xl font-bold text-sky-400">{aggStats.runs}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Wickets</p>
                <p className="text-xl font-bold text-sky-400">{aggStats.wickets}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Catches</p>
                <p className="text-xl font-bold text-sky-400">{aggStats.catches}</p>
              </div>
            </div>

            {/* Batting stats */}
            {aggStats.inningsBatted > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Batting</h3>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Innings</p>
                    <p className="font-bold text-slate-200">{aggStats.inningsBatted}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Avg</p>
                    <p className="font-bold text-slate-200">{battingAvg ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">SR</p>
                    <p className="font-bold text-slate-200">{battingStrikeRate ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">HS</p>
                    <p className="font-bold text-slate-200">{aggStats.highestScore}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">50s/100s</p>
                    <p className="font-bold text-slate-200">{aggStats.fifties}/{aggStats.hundreds}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">4s/6s</p>
                    <p className="font-bold text-slate-200">{aggStats.fours}/{aggStats.sixes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bowling stats */}
            {aggStats.inningsBowled > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bowling</h3>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Overs</p>
                    <p className="font-bold text-slate-200">{ballsToOversText(aggStats.ballsBowled)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Wickets</p>
                    <p className="font-bold text-slate-200">{aggStats.wickets}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Avg</p>
                    <p className="font-bold text-slate-200">{bowlingAvg ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Econ</p>
                    <p className="font-bold text-slate-200">{economyRate ?? "—"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Maidens</p>
                    <p className="font-bold text-slate-200">{aggStats.maidens}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fielding stats */}
            {(aggStats.catches + aggStats.stumpings + aggStats.runOuts) > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Fielding</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Catches</p>
                    <p className="font-bold text-slate-200">{aggStats.catches}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Stumpings</p>
                    <p className="font-bold text-slate-200">{aggStats.stumpings}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <p className="text-xs text-slate-500 mb-1">Run Outs</p>
                    <p className="font-bold text-slate-200">{aggStats.runOuts}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats by league */}
            {allStats.length > 1 && (
              <p className="text-xs text-slate-500">
                Stats aggregated from {allStats.length} league{allStats.length !== 1 ? "s" : ""}.
              </p>
            )}
          </>
        )}
      </div>

      {/* Advanced analytics section */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Advanced Analytics</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4">
          <p className="text-sm text-slate-400 mb-3">
            Advanced player analytics (wagon wheel, phase performance, scoring zones) require ball-by-ball data from live-scored matches.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">Wagon Wheel — requires zone data</span>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">Phase Performance — requires ball-by-ball</span>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1">Dot Ball % — requires ball-by-ball</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-600">
        <Link href="/cricket" className="hover:text-slate-400 transition-colors">
          ← Cricket Hub
        </Link>
      </div>
    </AppShell>
  );
}
