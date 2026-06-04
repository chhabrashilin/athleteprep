import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getActivePollsForLeague, getPollResults } from "@/lib/cricket/polls/queries";
import { getUserPollVotes } from "@/lib/cricket/polls/queries";
import { CricketPollCard } from "@/components/cricket/CricketPollCard";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { isCricketPollsEnabled } from "@/lib/config/feature-flags";
import { BarChart2 } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `${league.name} Polls — GameIQ` };
}

export default async function LeaguePollsPage({ params }: Props) {
  if (!isCricketPollsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Polls coming soon"
          description="Fan polls are not yet enabled on this deployment."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const [user, polls] = await Promise.all([
    getServerUser(),
    getActivePollsForLeague(league.id),
  ]);

  const canManage = user
    ? await userCanManageCricketLeague(league.id, user.id)
    : false;

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
      <PageHeader
        title={`${league.name} — Polls`}
        description="Fan polls: vote, view results, and follow the conversation."
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← {league.name}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Polls</span>
        <Link
          href={`/cricket/leagues/${slug}/community`}
          className="ml-auto text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          Community →
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <BarChart2 className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-300 mb-1">No polls yet.</p>
          {canManage ? (
            <p className="text-sm text-slate-500 max-w-xs">
              Create a poll from the community section to engage fans.
            </p>
          ) : (
            <p className="text-sm text-slate-500 max-w-xs">
              No polls have been created for this league yet.
            </p>
          )}
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
