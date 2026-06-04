import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Radio, FileText, BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchWithTeams } from "@/lib/cricket/matches/queries";
import { getMatchStream } from "@/lib/cricket/streaming/queries";
import { getLiveMatchState } from "@/lib/cricket/live-scoring/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) return { title: "Watch — GameIQ" };
  return {
    title: `Watch: ${match.title ?? matchSlugOrId} — GameIQ`,
    description: `Live cricket stream for ${match.title ?? matchSlugOrId}`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { matchSlugOrId } = await params;

  const [match, user] = await Promise.all([
    getCricketMatchWithTeams(matchSlugOrId).catch(() => null),
    getServerUser(),
  ]);

  if (!match) notFound();

  const matchRef = match.slug ?? match.id;

  // Fetch stream config.
  const stream = await getMatchStream(match.id).catch(() => null);

  // Access control: check visibility.
  const isPublic = stream?.visibility === "public" || stream?.visibility === "unlisted";
  const isLeagueMember = !!user && !!match.leagueId;

  if (!isPublic && !isLeagueMember) {
    if (!user) {
      return (
        <AppShell>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-slate-200 mb-2">Members only</p>
            <p className="text-sm text-slate-400 mb-4">This stream is only available to league members.</p>
            <Link href={`/auth/login?next=/cricket/matches/${matchRef}/watch`} className="text-sky-400 hover:underline text-sm">
              Sign in to watch
            </Link>
          </div>
        </AppShell>
      );
    }

    // Verify league membership.
    const supabase = await createServerSupabaseClient();
    let isMember = false;
    if (supabase && match.leagueId && user) {
      const { data } = await supabase.rpc("is_cricket_league_member", {
        _league_id: match.leagueId,
        _user_id: user.id,
      });
      isMember = data === true;
    }

    if (!isMember && stream?.visibility === "private") {
      return (
        <AppShell>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-red-400 mb-2">Access Denied</p>
            <p className="text-sm text-slate-400 mb-4">This stream is private.</p>
            <Link href={`/cricket/matches/${matchRef}`} className="text-sky-400 hover:underline text-sm">
              ← Back to match
            </Link>
          </div>
        </AppShell>
      );
    }
  }

  const liveState = await getLiveMatchState(match.id).catch(() => null);

  const homeTeamName = match.homeTeam?.name ?? "Home";
  const awayTeamName = match.awayTeam?.name ?? "Away";
  const matchTitle = match.title ?? `${homeTeamName} vs ${awayTeamName}`;

  const hasEmbed = !!(stream?.embedUrl && stream.allowPublicEmbed);
  const hasWatchLink = !!stream?.publicWatchUrl;
  const streamConfigured = !!stream && stream.status !== "not_configured";
  const isLive = stream?.status === "live";

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 flex-wrap">
        <Link href="/cricket" className="hover:text-slate-400">Cricket Hub</Link>
        {match.leagueSlug && (
          <>
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}`} className="hover:text-slate-400">
              {match.leagueName ?? match.leagueSlug}
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchRef}`} className="hover:text-slate-400">{matchTitle}</Link>
        <span>/</span>
        <span className="text-slate-400">Watch</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-semibold text-red-300">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{matchTitle}</h1>
        {match.scheduledStart && (
          <p className="text-sm text-slate-400 mt-1">
            {new Date(match.scheduledStart).toLocaleString()}
            {match.venue?.name ? ` · ${match.venue.name}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: video player area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video embed */}
          {hasEmbed ? (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video">
              <iframe
                src={stream!.embedUrl!}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={matchTitle}
              />
            </div>
          ) : hasWatchLink ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
              <p className="text-sm text-slate-400 mb-4">
                This stream is hosted externally. Click below to watch.
              </p>
              <a
                href={stream!.publicWatchUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Watch on external site
              </a>
            </div>
          ) : stream?.provider === "overlay_only" ? (
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-6 text-center">
              <p className="text-sm font-semibold text-sky-400 mb-2">Overlay-Only Mode</p>
              <p className="text-sm text-slate-400">
                This match uses overlay-only streaming. The video stream is external (OBS/vMix output).
                Overlay graphics are displayed in the broadcaster&apos;s stream software.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
              <p className="text-sm text-slate-400">
                {streamConfigured
                  ? "Stream video is not configured for embedding."
                  : "This match does not have a stream configured yet."}
              </p>
            </div>
          )}

          {/* Live score panel */}
          {liveState && liveState.status !== "not_started" && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-sky-400" />
                  Live Score
                </h2>
                <Link
                  href={`/cricket/matches/${matchRef}/live`}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Full match centre →
                </Link>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-100 tabular-nums">
                  {liveState.totalRuns}/{liveState.wicketsLost}
                </span>
                <span className="text-sm text-slate-500">({liveState.oversText})</span>
              </div>
              {liveState.currentRunRate != null && (
                <p className="text-xs text-slate-500 mt-1">
                  CRR: {liveState.currentRunRate.toFixed(2)}
                  {liveState.requiredRunRate != null && ` · RRR: ${liveState.requiredRunRate.toFixed(2)}`}
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1 capitalize">
                {liveState.status.replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Match info */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Match</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Format</span>
                <span className="text-slate-200">{match.matchType} · {match.oversPerInnings} ov</span>
              </div>
              {match.scheduledStart && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="text-slate-200">{new Date(match.scheduledStart).toLocaleDateString()}</span>
                </div>
              )}
              {match.venue?.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue</span>
                  <span className="text-slate-200 text-right">{match.venue.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Links</p>
            <Link
              href={`/cricket/matches/${matchRef}/live`}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Radio className="h-4 w-4 text-sky-400" />
              Live Match Centre
            </Link>
            <Link
              href={`/cricket/matches/${matchRef}/scorecard`}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              Scorecard
            </Link>
            <Link
              href={`/cricket/matches/${matchRef}/analytics`}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <BarChart2 className="h-4 w-4 text-purple-400" />
              Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end">
        <Link
          href={`/cricket/matches/${matchRef}`}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          ← Back to match
        </Link>
      </div>
    </AppShell>
  );
}
