import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchById } from "@/lib/cricket/matches/queries";
import { getCricketMatchThread, getRecentMatchThreadMessages } from "@/lib/cricket/threads/queries";
import { getActivePollsForMatch } from "@/lib/cricket/polls/queries";
import { CricketMatchThread } from "@/components/cricket/CricketMatchThread";
import { CricketPollCard } from "@/components/cricket/CricketPollCard";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import {
  isCricketCommunityEnabled,
  isCricketMatchThreadsEnabled,
  isCricketPollsEnabled,
} from "@/lib/config/feature-flags";
import { Radio, MessageSquare, BarChart2, FileText, Play } from "lucide-react";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) return { title: "Match not found — GameIQ" };
  return { title: `Fan Center — GameIQ` };
}

export default async function FanMatchCenterPage({ params }: Props) {
  if (!isCricketCommunityEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Fan Center coming soon"
          description="The fan match center is not yet enabled."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) notFound();

  const [user, thread, polls] = await Promise.all([
    getServerUser(),
    isCricketMatchThreadsEnabled() ? getCricketMatchThread(match.id) : Promise.resolve(null),
    isCricketPollsEnabled() ? getActivePollsForMatch(match.id) : Promise.resolve([]),
  ]);

  const messages = thread ? await getRecentMatchThreadMessages(match.id, 30) : [];
  const canPost = !!user;

  return (
    <AppShell>
      <div className="mb-3 flex items-center gap-3 text-sm">
        <Link
          href={`/cricket/matches/${matchSlugOrId}`}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Match
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Fan Center</span>
      </div>

      <h1 className="text-xl font-bold text-slate-100 mb-1">Fan Match Center</h1>
      <p className="text-sm text-slate-400 mb-5">
        Follow the action, join the discussion, and vote in polls.
      </p>

      {/* Quick links row */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={`/cricket/matches/${matchSlugOrId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          Scorecard
        </Link>
        <Link
          href={`/cricket/matches/${matchSlugOrId}/live`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <Radio className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
          Live Scores
        </Link>
        <Link
          href={`/cricket/matches/${matchSlugOrId}/watch`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <Play className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          Watch
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Thread — takes 2 cols on lg */}
        {isCricketMatchThreadsEnabled() && (
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden" style={{ minHeight: "26rem", display: "flex", flexDirection: "column" }}>
            <CricketMatchThread
              matchId={match.id}
              thread={thread}
              initialMessages={messages}
              canPost={canPost}
            />
          </div>
        )}

        {/* Polls column */}
        <div className="space-y-4">
          {isCricketPollsEnabled() && polls.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
                Fan Polls
              </h2>
              <div className="space-y-3">
                {polls.map((poll) => (
                  <CricketPollCard key={poll.id} poll={poll} canVote={canPost} />
                ))}
              </div>
            </div>
          )}

          {!user && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-center">
              <p className="text-xs text-slate-500 mb-2">Sign in to join the conversation and vote in polls.</p>
              <Link
                href="/login"
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
