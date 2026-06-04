import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchById } from "@/lib/cricket/matches/queries";
import { getCricketMatchThread, getRecentMatchThreadMessages } from "@/lib/cricket/threads/queries";
import { CricketMatchThread } from "@/components/cricket/CricketMatchThread";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { isCricketMatchThreadsEnabled } from "@/lib/config/feature-flags";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) return { title: "Match not found — GameIQ" };
  return { title: `Match Thread — GameIQ` };
}

export default async function MatchThreadPage({ params }: Props) {
  if (!isCricketMatchThreadsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Match threads coming soon"
          description="Match discussion threads are not yet enabled."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) notFound();

  const [user, thread] = await Promise.all([
    getServerUser(),
    getCricketMatchThread(match.id),
  ]);

  const messages = thread ? await getRecentMatchThreadMessages(match.id, 50) : [];

  // Determine if user can post — must be authenticated.
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
        <span className="text-slate-300">Fan Thread</span>
        <Link
          href={`/cricket/matches/${matchSlugOrId}/fan`}
          className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Fan Center →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden" style={{ minHeight: "28rem", display: "flex", flexDirection: "column" }}>
        <CricketMatchThread
          matchId={match.id}
          thread={thread}
          initialMessages={messages}
          canPost={canPost}
        />
      </div>
    </AppShell>
  );
}
