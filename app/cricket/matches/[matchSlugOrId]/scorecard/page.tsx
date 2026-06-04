import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketFullScorecard } from "@/lib/cricket/scorecards/queries";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { userCanManageCricketLeague } from "@/lib/cricket/matches/queries";
import {
  ScorecardStatusBadge,
  InningsScorecard,
} from "@/components/cricket/ScorecardDisplay";
import type { CricketTeam } from "@/lib/cricket/types";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const scorecard = await getCricketFullScorecard(matchSlugOrId).catch(() => null);
  if (!scorecard) return { title: "Scorecard — GameIQ" };
  const home = scorecard.homeTeam?.name ?? "Home";
  const away = scorecard.awayTeam?.name ?? "Away";
  return { title: `${home} vs ${away} Scorecard — GameIQ` };
}

export default async function ScorecardPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const [scorecard, user] = await Promise.all([
    getCricketFullScorecard(matchSlugOrId).catch(() => null),
    getServerUser(),
  ]);

  if (!scorecard) notFound();

  const { match, innings, battingEntries, bowlingEntries, fallOfWickets, homeTeam, awayTeam } = scorecard;

  const [canScore, canManage] = await Promise.all([
    user ? userCanScoreCricketMatch(user.id, match.id) : Promise.resolve(false),
    user && match.leagueId
      ? userCanManageCricketLeague(user.id, match.leagueId)
      : Promise.resolve(false),
  ]);

  const isAuthorized = canScore || canManage;
  const hasScorecard = match.scorecardStatus !== "not_started";
  const homeTeamForDisplay = homeTeam as CricketTeam | null;
  const awayTeamForDisplay = awayTeam as CricketTeam | null;

  return (
    <AppShell>
      {/* Breadcrumb */}
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
        <span className="text-slate-400">Scorecard</span>
      </div>

      {/* Match header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {homeTeamForDisplay?.name ?? "Home"} vs {awayTeamForDisplay?.name ?? "Away"}
            </h1>
            {match.resultSummary && (
              <p className="text-sm font-medium text-sky-400 mt-1">{match.resultSummary}</p>
            )}
            {match.scheduledStart && (
              <p className="text-xs text-slate-500 mt-1">
                {new Date(match.scheduledStart).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {match.tossWinnerTeamId && match.tossDecision && (
              <p className="text-xs text-slate-500 mt-0.5">
                Toss: {
                  match.tossWinnerTeamId === match.homeTeamId
                    ? homeTeamForDisplay?.name
                    : awayTeamForDisplay?.name
                } elected to {match.tossDecision}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ScorecardStatusBadge status={match.scorecardStatus} />
            {isAuthorized && hasScorecard && (
              <Link
                href={`/cricket/matches/${matchSlugOrId}/scorecard/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Edit Scorecard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Scorecard content */}
      {!hasScorecard ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
          <p className="text-base text-slate-400 mb-2">Scorecard has not been started yet.</p>
          {isAuthorized && (
            <Link
              href={`/cricket/matches/${matchSlugOrId}/setup`}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              Set Up Scorecard
            </Link>
          )}
        </div>
      ) : innings.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No innings data entered yet.</p>
          {isAuthorized && (
            <Link
              href={`/cricket/matches/${matchSlugOrId}/scorecard/edit`}
              className="mt-3 inline-flex items-center text-sm text-sky-400 hover:underline"
            >
              Open Scorecard Entry →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {innings.map((inn) => (
            <InningsScorecard
              key={inn.id}
              innings={inn}
              battingEntries={battingEntries[inn.id] ?? []}
              bowlingEntries={bowlingEntries[inn.id] ?? []}
              fow={fallOfWickets[inn.id] ?? []}
              battingTeam={
                inn.battingTeamId === match.homeTeamId ? homeTeamForDisplay : awayTeamForDisplay
              }
              bowlingTeam={
                inn.bowlingTeamId === match.homeTeamId ? homeTeamForDisplay : awayTeamForDisplay
              }
            />
          ))}
        </div>
      )}

      {/* Admin actions */}
      {isAuthorized && hasScorecard && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/cricket/matches/${matchSlugOrId}/scorecard/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Edit Scorecard
          </Link>
          {match.scorecardStatus === "in_progress" && (
            <Link
              href={`/cricket/matches/${matchSlugOrId}/result`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Finalize Result
            </Link>
          )}
        </div>
      )}

      {/* Live Scoring — Coming Soon */}
      <div className="mt-6 rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Coming Soon</p>
        <p className="text-sm text-slate-500">Ball-by-Ball Live Scoring — real-time over-by-over scoring is coming in Prompt 33.</p>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Link
          href={`/cricket/matches/${matchSlugOrId}`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to match
        </Link>
      </div>
    </AppShell>
  );
}
