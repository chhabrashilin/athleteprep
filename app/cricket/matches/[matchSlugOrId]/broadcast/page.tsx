import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Radio, BarChart2, FileText, Eye, Tv2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchWithTeams } from "@/lib/cricket/matches/queries";
import { userCanManageMatchBroadcast, getMatchStream, getBroadcastChecklist, getStreamEvents, getLatestStreamHealth } from "@/lib/cricket/streaming/queries";
import { getMatchOverlayTokens, getOverlayThemesForLeague } from "@/lib/cricket/overlays/queries";
import { BroadcastControlRoom } from "@/components/cricket/BroadcastControlRoom";
import { isCricketBroadcastOverlaysEnabled } from "@/lib/config/feature-flags";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchWithTeams(matchSlugOrId).catch(() => null);
  if (!match) return { title: "Broadcast — GameIQ" };
  return { title: `Broadcast Control — ${match.title ?? matchSlugOrId} — GameIQ` };
}

export default async function BroadcastPage({ params }: Props) {
  if (!isCricketBroadcastOverlaysEnabled()) {
    redirect("/cricket");
  }

  const { matchSlugOrId } = await params;
  const [match, user] = await Promise.all([
    getCricketMatchWithTeams(matchSlugOrId).catch(() => null),
    getServerUser(),
  ]);

  if (!match) notFound();
  if (!user) redirect(`/auth/login?next=/cricket/matches/${matchSlugOrId}/broadcast`);

  const canManage = await userCanManageMatchBroadcast(user.id, match.id);
  if (!canManage) {
    return (
      <AppShell>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-lg font-semibold text-red-400 mb-2">Access Denied</p>
          <p className="text-sm text-slate-400 mb-4">You need league manager or admin access to use the broadcast control room.</p>
          <Link href={`/cricket/matches/${match.slug ?? match.id}`} className="text-sky-400 hover:underline text-sm">
            ← Back to match
          </Link>
        </div>
      </AppShell>
    );
  }

  const matchRef = match.slug ?? match.id;
  const homeTeamName = match.homeTeam?.name ?? "Home";
  const awayTeamName = match.awayTeam?.name ?? "Away";
  const matchTitle = match.title ?? `${homeTeamName} vs ${awayTeamName}`;

  const [stream, tokens, checklist, events, themes] = await Promise.all([
    getMatchStream(match.id).catch(() => null),
    getMatchOverlayTokens(match.id).catch(() => []),
    getBroadcastChecklist(match.id).catch(() => []),
    getStreamEvents(match.id, 30).catch(() => []),
    match.leagueId ? getOverlayThemesForLeague(match.leagueId).catch(() => []) : Promise.resolve([]),
  ]);

  const latestHealth = stream ? await getLatestStreamHealth(stream.id).catch(() => null) : null;

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
            <span>/</span>
            <Link href={`/cricket/leagues/${match.leagueSlug}/schedule`} className="hover:text-slate-400">
              Schedule
            </Link>
          </>
        )}
        <span>/</span>
        <Link href={`/cricket/matches/${matchRef}`} className="hover:text-slate-400">{matchTitle}</Link>
        <span>/</span>
        <span className="text-slate-400">Broadcast</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-5 w-5 text-red-400" />
            <h1 className="text-xl font-bold text-slate-100">Broadcast Control Room</h1>
          </div>
          <p className="text-sm text-slate-400">{matchTitle}</p>
          {match.scheduledStart && (
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(match.scheduledStart).toLocaleString()}
              {match.venue?.name ? ` · ${match.venue.name}` : ""}
            </p>
          )}
        </div>
        {/* Quick links */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cricket/matches/${matchRef}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Match Info
          </Link>
          <Link
            href={`/cricket/matches/${matchRef}/live-score`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <Radio className="h-3.5 w-3.5" />
            Live Scoring
          </Link>
          <Link
            href={`/cricket/matches/${matchRef}/live`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Live Viewer
          </Link>
          <Link
            href={`/cricket/matches/${matchRef}/watch`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Tv2 className="h-3.5 w-3.5" />
            Watch Page
          </Link>
          <Link
            href={`/cricket/matches/${matchRef}/analytics`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </Link>
        </div>
      </div>

      <BroadcastControlRoom
        matchId={match.id}
        matchSlug={matchRef}
        matchTitle={matchTitle}
        leagueId={match.leagueId ?? null}
        stream={stream}
        tokens={tokens}
        checklist={checklist}
        events={events}
        latestHealth={latestHealth}
        themes={themes}
      />

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
