import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchBySlugOrId, userCanManageCricketLeague } from "@/lib/cricket/matches/queries";
import { getCricketFullScorecard, userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { getActiveCricketVenues } from "@/lib/cricket/venues/queries";
import { ScorecardEditor } from "@/components/cricket/ScorecardEditor";
import { getLiveMatchState } from "@/lib/cricket/live-scoring/queries";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export const metadata: Metadata = { title: "Edit Scorecard — GameIQ" };

export default async function ScorecardEditPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const user = await getServerUser();
  if (!user) redirect("/auth");

  const match = await getCricketMatchBySlugOrId(matchSlugOrId).catch(() => null);
  if (!match) notFound();

  const [canScore, canManage] = await Promise.all([
    userCanScoreCricketMatch(user.id, match.id),
    match.leagueId ? userCanManageCricketLeague(user.id, match.leagueId) : Promise.resolve(false),
  ]);

  if (!canScore && !canManage) {
    redirect(`/cricket/matches/${matchSlugOrId}/scorecard`);
  }

  // Redirect to setup if not started
  if (match.scorecardStatus === "not_started") {
    redirect(`/cricket/matches/${matchSlugOrId}/setup`);
  }

  const [scorecard, liveState] = await Promise.all([
    getCricketFullScorecard(matchSlugOrId).catch(() => null),
    getLiveMatchState(match.id).catch(() => null),
  ]);
  if (!scorecard) notFound();

  const hasLiveData = liveState && liveState.status !== "not_started" && liveState.ballsBowled > 0;

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {scorecard.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${scorecard.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="hover:text-slate-400">Match</Link>
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}/scorecard`} className="hover:text-slate-400">Scorecard</Link>
        <span>/</span>
        <span className="text-slate-400">Edit</span>
      </div>

      <PageHeader
        title="Scorecard Entry"
        description={`${scorecard.homeTeam?.name ?? "Home"} vs ${scorecard.awayTeam?.name ?? "Away"}`}
      />

      {hasLiveData && (
        <div className="mb-5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-yellow-300 mb-1">Live scoring data exists</p>
          <p className="text-xs text-slate-400">
            This match has ball-by-ball live scoring data ({liveState.ballsBowled} balls bowled).
            Manual edits made here may be inconsistent with live scoring data if the innings is rebuilt.
          </p>
          <Link
            href={`/cricket/matches/${matchSlugOrId}/live-score`}
            className="mt-2 inline-block text-xs text-sky-400 hover:underline"
          >
            Go to Live Scorer →
          </Link>
        </div>
      )}

      <ScorecardEditor scorecard={scorecard} matchSlug={matchSlugOrId} />

      <div className="mt-8 flex items-center justify-end">
        <Link
          href={`/cricket/matches/${matchSlugOrId}/scorecard`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← View scorecard
        </Link>
      </div>
    </AppShell>
  );
}
