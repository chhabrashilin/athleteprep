import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketMatchById } from "@/lib/cricket/matches/queries";
import { getActivePollsForMatch, getPollResults, getUserPollVotes } from "@/lib/cricket/polls/queries";
import { CricketPollCard } from "@/components/cricket/CricketPollCard";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { isCricketPollsEnabled } from "@/lib/config/feature-flags";
import { BarChart2 } from "lucide-react";

interface Props {
  params: Promise<{ matchSlugOrId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) return { title: "Match not found — GameIQ" };
  return { title: `Match Polls — GameIQ` };
}

export default async function MatchPollsPage({ params }: Props) {
  if (!isCricketPollsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Polls coming soon"
          description="Fan polls are not yet enabled."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { matchSlugOrId } = await params;
  const match = await getCricketMatchById(matchSlugOrId);
  if (!match) notFound();

  const [user, polls] = await Promise.all([
    getServerUser(),
    getActivePollsForMatch(match.id),
  ]);

  const pollsWithData = await Promise.all(
    polls.map(async (poll) => {
      const [results, votedIds] = await Promise.all([
        getPollResults(poll.id, user?.id),
        user ? getUserPollVotes(poll.id, user.id) : Promise.resolve([]),
      ]);
      return { poll, results, votedIds };
    })
  );

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link
          href={`/cricket/matches/${matchSlugOrId}`}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Match
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Polls</span>
      </div>

      <h1 className="text-lg font-bold text-slate-100 mb-4">Match Polls</h1>

      {polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <BarChart2 className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-300 mb-1">No polls yet.</p>
          <p className="text-sm text-slate-500 max-w-xs">
            No polls have been created for this match yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pollsWithData.map(({ poll, results, votedIds }) => (
            <CricketPollCard
              key={poll.id}
              poll={poll}
              results={results}
              canVote={!!user && poll.status === "open"}
              initialVotedOptionIds={votedIds}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
