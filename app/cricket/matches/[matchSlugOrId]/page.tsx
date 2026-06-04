import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, FileText, Edit, Radio, Tv2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import {
  getCricketMatchWithTeams,
  getCricketMatchOfficials,
  userCanManageCricketLeague,
} from "@/lib/cricket/matches/queries";
import { ScheduleStatusBadge, PublishStatusBadge, formatMatchDate } from "@/components/cricket/MatchCard";
import { MatchActionsPanel } from "@/components/cricket/MatchActionsPanel";
import { ScorecardStatusBadge } from "@/components/cricket/ScorecardDisplay";
import { userCanScoreCricketMatch } from "@/lib/cricket/scorecards/queries";
import { getLiveMatchState } from "@/lib/cricket/live-scoring/queries";
import { getMatchStream } from "@/lib/cricket/streaming/queries";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) return { title: "Match — GameIQ" };
  const home = match.homeTeam?.name ?? "Home";
  const away = match.awayTeam?.name ?? "Away";
  return { title: `${home} vs ${away} — GameIQ` };
}

export default async function MatchDetailPage({ params }: Props) {
  const { matchSlugOrId } = await params;
  const [match, user] = await Promise.all([
    getCricketMatchWithTeams(matchSlugOrId).catch(() => null),
    getServerUser(),
  ]);

  if (!match) notFound();

  const [officials, canManage, canScore, liveState, matchStream] = await Promise.all([
    getCricketMatchOfficials(match.id).catch(() => []),
    user && match.leagueId
      ? userCanManageCricketLeague(user.id, match.leagueId)
      : Promise.resolve(false),
    user
      ? userCanScoreCricketMatch(user.id, match.id)
      : Promise.resolve(false),
    getLiveMatchState(match.id).catch(() => null),
    getMatchStream(match.id).catch(() => null),
  ]);

  const homeTeamName = match.homeTeam?.name ?? "Home Team";
  const awayTeamName = match.awayTeam?.name ?? "Away Team";
  const editHref = `/cricket/matches/${match.slug ?? match.id}/edit`;

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {match.leagueSlug && (
          <>
            <span>/</span>
            <Link href="/cricket/leagues" className="hover:text-slate-400">Leagues</Link>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}`} className="hover:text-slate-400">
              {match.leagueName ?? match.leagueSlug}
            </Link>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-400">{homeTeamName} vs {awayTeamName}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          {match.matchNumber && (
            <p className="text-xs text-slate-500 mb-1">Match #{match.matchNumber}</p>
          )}
          <h1 className="text-2xl font-bold text-slate-100">
            {match.title ?? `${homeTeamName} vs ${awayTeamName}`}
          </h1>
          {!match.title && (
            <p className="text-sm text-slate-400 mt-1">{homeTeamName} vs {awayTeamName}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScheduleStatusBadge status={match.scheduleStatus} />
          <PublishStatusBadge status={match.publishStatus} />
          {canManage && (
            <Link
              href={editHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Match details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Match Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-slate-500">Home</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">
                  {match.homeTeam ? (
                    <Link href={`/cricket/teams/${match.homeTeam.slug ?? match.homeTeam.id}`} className="hover:text-sky-400 transition-colors">
                      {homeTeamName}
                    </Link>
                  ) : homeTeamName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Away</dt>
                <dd className="text-sm font-medium text-slate-200 mt-0.5">
                  {match.awayTeam ? (
                    <Link href={`/cricket/teams/${match.awayTeam.slug ?? match.awayTeam.id}`} className="hover:text-sky-400 transition-colors">
                      {awayTeamName}
                    </Link>
                  ) : awayTeamName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Format</dt>
                <dd className="text-sm text-slate-200 mt-0.5">{match.matchType} · {match.oversPerInnings} overs</dd>
              </div>
              {match.stage && (
                <div>
                  <dt className="text-xs text-slate-500">Stage</dt>
                  <dd className="text-sm text-slate-200 mt-0.5 capitalize">{match.stage.replace(/_/g, " ")}</dd>
                </div>
              )}
              {match.roundName && (
                <div>
                  <dt className="text-xs text-slate-500">Round</dt>
                  <dd className="text-sm text-slate-200 mt-0.5">{match.roundName}</dd>
                </div>
              )}
              {match.neutralMatch && (
                <div>
                  <dt className="text-xs text-slate-500">Neutral</dt>
                  <dd className="text-sm text-slate-200 mt-0.5">Yes</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Schedule</h2>
            <div className="space-y-2">
              {match.scheduledStart ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-300">{formatMatchDate(match.scheduledStart)}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Date/time not yet scheduled.</p>
              )}
              {match.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <Link
                    href={`/cricket/venues/${match.venue.slug ?? match.venue.id}`}
                    className="text-sm text-sky-400 hover:underline"
                  >
                    {match.venue.name}
                    {match.venue.city && `, ${match.venue.city}`}
                  </Link>
                </div>
              )}
              {match.cancellationReason && (
                <p className="text-xs text-red-400 mt-2">
                  Cancelled: {match.cancellationReason}
                </p>
              )}
            </div>
          </div>

          {/* Officials */}
          {(officials.length > 0 || match.primaryUmpireName || match.secondaryUmpireName) && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Officials
              </h2>
              <div className="space-y-2">
                {match.primaryUmpireName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Umpire</span>
                    <span className="text-sm text-slate-300">{match.primaryUmpireName}</span>
                  </div>
                )}
                {match.secondaryUmpireName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Square Leg</span>
                    <span className="text-sm text-slate-300">{match.secondaryUmpireName}</span>
                  </div>
                )}
                {match.matchRefereeName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Referee</span>
                    <span className="text-sm text-slate-300">{match.matchRefereeName}</span>
                  </div>
                )}
                {officials.map((o) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 capitalize">{o.role.replace(/_/g, " ")}</span>
                    <span className="text-sm text-slate-300">{o.name ?? o.email ?? "TBD"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {match.notes && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </h2>
              <p className="text-sm text-slate-400 whitespace-pre-line">{match.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Scorecard card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scorecard</p>
              <ScorecardStatusBadge status={match.scorecardStatus} />
            </div>
            {match.resultSummary && (
              <p className="text-sm font-medium text-sky-400">{match.resultSummary}</p>
            )}
            <div className="flex flex-col gap-2">
              <Link
                href={`/cricket/matches/${match.slug ?? match.id}/scorecard`}
                className="block w-full rounded-lg bg-slate-800 px-3 py-2 text-center text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                View Scorecard
              </Link>
              {(canScore || canManage) && (
                <>
                  {match.scorecardStatus === "not_started" && (
                    <Link
                      href={`/cricket/matches/${match.slug ?? match.id}/setup`}
                      className="block w-full rounded-lg border border-sky-500/30 px-3 py-2 text-center text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
                    >
                      Set Up Scorecard
                    </Link>
                  )}
                  {match.scorecardStatus !== "not_started" && match.scorecardStatus !== "locked" && (
                    <Link
                      href={`/cricket/matches/${match.slug ?? match.id}/scorecard/edit`}
                      className="block w-full rounded-lg border border-sky-500/30 px-3 py-2 text-center text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
                    >
                      Edit Scorecard
                    </Link>
                  )}
                  {(match.scorecardStatus === "in_progress" || match.scorecardStatus === "completed") && (
                    <Link
                      href={`/cricket/matches/${match.slug ?? match.id}/result`}
                      className="block w-full rounded-lg border border-emerald-500/30 px-3 py-2 text-center text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      Finalize Result
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Live scoring card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-sky-400" />
                Live Scoring
              </p>
              {liveState && liveState.status === "live" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-xs font-semibold text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>

            {liveState && liveState.status !== "not_started" && (
              <div>
                <p className="text-2xl font-bold text-slate-100 tabular-nums">
                  {liveState.totalRuns}/{liveState.wicketsLost}
                </p>
                <p className="text-xs text-slate-500">({liveState.oversText}) · {liveState.status.replace(/_/g, " ")}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Link
                href={`/cricket/matches/${match.slug ?? match.id}/live`}
                className="block w-full rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-sky-500 transition-colors"
              >
                Open Live Match Centre
              </Link>
              {(canScore || canManage) && (
                <Link
                  href={`/cricket/matches/${match.slug ?? match.id}/live-score`}
                  className="block w-full rounded-lg border border-orange-500/30 px-3 py-2 text-center text-sm font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  Open Scorer Interface
                </Link>
              )}
            </div>
          </div>

          {/* Analytics card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Analytics</p>
            <Link
              href={`/cricket/matches/${match.slug ?? match.id}/analytics`}
              className="block w-full rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-center text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
            >
              View Match Analytics
            </Link>
          </div>

          {/* Broadcast card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tv2 className="h-3.5 w-3.5 text-purple-400" />
                Broadcast
              </p>
              {matchStream && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  matchStream.status === "live" ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : matchStream.status === "ready" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-slate-700 text-slate-400"
                }`}>
                  {matchStream.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1" />}
                  {matchStream.status.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {matchStream?.publicWatchUrl && (
                <a
                  href={matchStream.publicWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-purple-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-purple-500 transition-colors"
                >
                  Watch Stream
                </a>
              )}
              <Link
                href={`/cricket/matches/${match.slug ?? match.id}/watch`}
                className="block w-full rounded-lg border border-purple-500/30 px-3 py-2 text-center text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                Watch Page
              </Link>
              {canManage && (
                <Link
                  href={`/cricket/matches/${match.slug ?? match.id}/broadcast`}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Broadcast Control Room
                </Link>
              )}
            </div>
            {!matchStream && (
              <p className="text-xs text-slate-500">No stream configured.</p>
            )}
          </div>

          {/* Manager actions */}
          {canManage && (
            <MatchActionsPanel
              matchId={match.id}
              matchSlug={match.slug}
              leagueId={match.leagueId ?? ""}
              leagueSlug={match.leagueSlug ?? ""}
              scheduleStatus={match.scheduleStatus}
              publishStatus={match.publishStatus}
            />
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        {match.leagueSlug ? (
          <Link
            href={`/cricket/leagues/${match.leagueSlug}/schedule`}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Back to schedule
          </Link>
        ) : (
          <Link href="/cricket/matches" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to matches
          </Link>
        )}
      </div>
    </AppShell>
  );
}
