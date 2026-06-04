import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchBySlugOrId, userCanManageCricketLeague } from "@/lib/cricket/matches/queries";
import { getCricketInningsForMatch, userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { ResultFinalizationForm } from "@/components/cricket/ResultFinalizationForm";
import { determineMatchResult } from "@/lib/cricket/scorecards/calculations";
import type { InningsForResult } from "@/lib/cricket/scorecards/calculations";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export const metadata: Metadata = { title: "Finalize Result — GameIQ" };

export default async function ResultPage({ params }: Props) {
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

  const innings = await getCricketInningsForMatch(match.id).catch(() => []);

  // Auto-suggest result
  let suggestedResult = null;
  if (match.homeTeamId && match.awayTeamId && innings.length >= 2) {
    try {
      suggestedResult = determineMatchResult({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        innings: innings as InningsForResult[],
        scheduledOvers: match.oversPerInnings,
      });
    } catch {
      // ignore
    }
  }

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        <span>/</span>
        <Link href={`/cricket/matches/${matchSlugOrId}`} className="hover:text-slate-400">Match</Link>
        <span>/</span>
        <span className="text-slate-400">Finalize Result</span>
      </div>

      <PageHeader
        title="Finalize Match Result"
        description="Confirm the match result and lock the scorecard."
      />

      <div className="max-w-xl space-y-4">
        {suggestedResult && suggestedResult.resultType !== "unknown" && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold text-sky-400 mb-1">Computed Result</p>
            <p className="text-sm text-slate-300">
              {suggestedResult.resultSummary ?? suggestedResult.resultType}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              You can accept this suggestion or override it below.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-amber-400">
            Finalizing the result will mark the scorecard as complete and the match as finished.
          </p>
        </div>

        <ResultFinalizationForm
          matchId={match.id}
          matchSlug={matchSlugOrId}
          homeTeamId={match.homeTeamId ?? ""}
          awayTeamId={match.awayTeamId ?? ""}
          suggestedResult={suggestedResult}
        />
      </div>

      <div className="mt-6 flex items-center justify-end">
        <Link
          href={`/cricket/matches/${matchSlugOrId}/scorecard`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to scorecard
        </Link>
      </div>
    </AppShell>
  );
}
