import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketTeamBySlug } from "@/lib/cricket/teams/queries";
import { getCricketCommunityFeed } from "@/lib/cricket/community/queries";
import { CricketFeed } from "@/components/cricket/CricketFeed";
import { CricketPostComposer } from "@/components/cricket/CricketPostComposer";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { isCricketCommunityEnabled } from "@/lib/config/feature-flags";

interface Props {
  params: Promise<{ teamSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) return { title: "Team not found — GameIQ" };
  return { title: `${team.name} Community — GameIQ` };
}

export default async function TeamCommunityPage({ params }: Props) {
  if (!isCricketCommunityEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Community coming soon"
          description="The community section is not yet enabled on this deployment."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { teamSlug } = await params;
  const team = await getCricketTeamBySlug(teamSlug);
  if (!team) notFound();

  const [user, feed] = await Promise.all([
    getServerUser(),
    getCricketCommunityFeed({ teamId: team.id, limit: 20 }),
  ]);

  return (
    <AppShell>
      <PageHeader
        title={`${team.name} — Community`}
        description="Team announcements and member discussions."
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href={`/cricket/teams/${teamSlug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← {team.name}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Community</span>
      </div>

      {user && (
        <div className="mb-5">
          <CricketPostComposer
            teamId={team.id}
            leagueId={team.leagueId ?? undefined}
            postType="post"
            placeholder="Share a team update…"
          />
        </div>
      )}

      <CricketFeed
        posts={feed}
        emptyTitle="No team posts yet."
        emptyDescription={
          user
            ? "Start the conversation for your team."
            : "No team posts have been published yet."
        }
      />
    </AppShell>
  );
}
