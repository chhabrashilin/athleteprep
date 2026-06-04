import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchWithTeams } from "@/lib/cricket/matches/queries";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { getLiveMatchState, getRecentCricketBallEvents } from "@/lib/cricket/live-scoring/queries";
import { getCricketMatchSquadsWithPlayers } from "@/lib/cricket/scorecards/queries";
import { LiveViewerClient } from "@/components/cricket/LiveViewerClient";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) return { title: "Live Match — GameIQ" };
  const home = match.homeTeam?.name ?? "Home";
  const away = match.awayTeam?.name ?? "Away";
  return {
    title: `${home} vs ${away} — Live — GameIQ`,
    description: `Follow ${home} vs ${away} live ball-by-ball on GameIQ`,
  };
}

export default async function LiveMatchViewerPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const user = await getServerUser();

  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) notFound();

  const [liveState, recentEvents, squads, canScore] = await Promise.all([
    getLiveMatchState(match.id).catch(() => null),
    getRecentCricketBallEvents(match.id, 48).catch(() => []),
    getCricketMatchSquadsWithPlayers(match.id).catch(() => []),
    user ? userCanScoreCricketMatch(user.id, match.id) : Promise.resolve(false),
  ]);

  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const matchSlug = match.slug ?? match.id;
  const matchTitle = match.title ?? `${homeTeam?.name ?? "Home"} vs ${awayTeam?.name ?? "Away"}`;

  const playerNames: Record<string, string> = Object.fromEntries(
    squads.map((s) => [s.player.id, s.player.displayName])
  );

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {match.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlug}`} className="hover:text-slate-400">
          {homeTeam?.name ?? "Home"} vs {awayTeam?.name ?? "Away"}
        </Link>
        <span>/</span>
        <span className="text-slate-400">Live</span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">{matchTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live Match Centre
            {match.oversPerInnings && ` · ${match.oversPerInnings} overs`}
            {match.matchType && ` · ${match.matchType}`}
          </p>
        </div>
        {canScore && (
          <Link
            href={`/cricket/matches/${matchSlug}/live-score`}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            Open Scorer
          </Link>
        )}
      </div>

      <LiveViewerClient
        matchId={match.id}
        matchSlug={matchSlug}
        matchTitle={matchTitle}
        homeTeam={{ id: homeTeam?.id ?? "", name: homeTeam?.name ?? "Home" }}
        awayTeam={{ id: awayTeam?.id ?? "", name: awayTeam?.name ?? "Away" }}
        initialLiveState={liveState}
        initialEvents={recentEvents}
        playerNames={playerNames}
        scorecardLink={`/cricket/matches/${matchSlug}/scorecard`}
        matchInfoLink={`/cricket/matches/${matchSlug}`}
        scorerLink={canScore ? `/cricket/matches/${matchSlug}/live-score` : undefined}
        canScore={canScore}
      />
    </AppShell>
  );
}
