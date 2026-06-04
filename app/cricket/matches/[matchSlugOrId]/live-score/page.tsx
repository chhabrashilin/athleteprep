import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchWithTeams } from "@/lib/cricket/matches/queries";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { getLiveMatchState, getRecentCricketBallEvents } from "@/lib/cricket/live-scoring/queries";
import { getCricketMatchSquadsWithPlayers } from "@/lib/cricket/scorecards/queries";
import { LiveScoringClient } from "@/components/cricket/LiveScoringClient";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) return { title: "Live Scoring — GameIQ" };
  const home = match.homeTeam?.name ?? "Home";
  const away = match.awayTeam?.name ?? "Away";
  return { title: `Live Score: ${home} vs ${away} — GameIQ` };
}

export default async function LiveScorePage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const user = await getServerUser();

  if (!user) redirect("/login");

  const [match, canScore] = await Promise.all([
    getCricketMatchWithTeams(matchSlugOrId).catch(() => null),
    user
      ? (async () => {
          const m = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
          return m ? userCanScoreCricketMatch(user.id, m.id) : false;
        })()
      : Promise.resolve(false),
  ]);

  if (!match) notFound();

  const [liveState, recentEvents, squads] = await Promise.all([
    getLiveMatchState(match.id).catch(() => null),
    getRecentCricketBallEvents(match.id, 48).catch(() => []),
    getCricketMatchSquadsWithPlayers(match.id).catch(() => []),
  ]);

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;

  if (!homeTeam || !awayTeam) {
    return (
      <AppShell>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-300">Match is missing team assignments. Please check the match setup.</p>
          <Link href={`/cricket/matches/${match.slug ?? match.id}/setup`} className="mt-3 inline-block text-sky-400 hover:underline text-sm">
            Go to Match Setup
          </Link>
        </div>
      </AppShell>
    );
  }

  const squadPlayers = squads.map((s) => ({
    id: s.player.id,
    name: s.player.displayName,
  }));

  const matchSlug = match.slug ?? match.id;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {match.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}/schedule`} className="hover:text-slate-400">Schedule</Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlug}`} className="hover:text-slate-400">
          {homeTeam.name} vs {awayTeam.name}
        </Link>
        <span>/</span>
        <span className="text-slate-400">Live Scoring</span>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-100">
          Live Scoring
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {homeTeam.name} vs {awayTeam.name}
        </p>
      </div>

      <LiveScoringClient
        matchId={match.id}
        matchSlug={matchSlug}
        homeTeam={{ id: homeTeam.id, name: homeTeam.name }}
        awayTeam={{ id: awayTeam.id, name: awayTeam.name }}
        initialLiveState={liveState}
        initialEvents={recentEvents}
        squadPlayers={squadPlayers}
        canScore={canScore}
        scorecardStatus={match.scorecardStatus ?? "not_started"}
        leagueSlug={match.leagueSlug}
      />
    </AppShell>
  );
}
