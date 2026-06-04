import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Megaphone, BarChart2, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketLeagueBySlugFull, userCanManageCricketLeague } from "@/lib/cricket/leagues/queries";
import { getCricketCommunityFeed, getPinnedPosts } from "@/lib/cricket/community/queries";
import { getActivePollsForLeague } from "@/lib/cricket/polls/queries";
import { CricketFeed } from "@/components/cricket/CricketFeed";
import { CricketPostComposer } from "@/components/cricket/CricketPostComposer";
import { CricketAnnouncementBanner } from "@/components/cricket/CricketAnnouncementBanner";
import { CricketPollCard } from "@/components/cricket/CricketPollCard";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import {
  isCricketCommunityEnabled,
  isCricketPollsEnabled,
} from "@/lib/config/feature-flags";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) return { title: "League not found — GameIQ" };
  return { title: `${league.name} Community — GameIQ` };
}

const TABS = [
  { key: "all", label: "All" },
  { key: "announcements", label: "Announcements" },
  { key: "discussions", label: "Discussions" },
  { key: "polls", label: "Polls" },
  { key: "match_updates", label: "Match Updates" },
] as const;

export default async function LeagueCommunityPage({ params, searchParams }: Props) {
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

  const [{ slug }, { tab = "all" }] = await Promise.all([params, searchParams]);
  const league = await getCricketLeagueBySlugFull(slug);
  if (!league) notFound();

  const [user, feed, pinned, polls] = await Promise.all([
    getServerUser(),
    getCricketCommunityFeed({
      leagueId: league.id,
      postType: tab === "announcements" ? "announcement"
        : tab === "discussions" ? "post"
        : tab === "match_updates" ? "match_update"
        : undefined,
      limit: 20,
    }),
    getPinnedPosts({ leagueId: league.id }),
    isCricketPollsEnabled() ? getActivePollsForLeague(league.id) : Promise.resolve([]),
  ]);

  const [canManage, canPost] = await Promise.all([
    user ? userCanManageCricketLeague(league.id, user.id) : Promise.resolve(false),
    user ? Promise.resolve(true) : Promise.resolve(false),
  ]);

  const announcements = pinned.filter((p) => p.postType === "announcement");

  return (
    <AppShell>
      <PageHeader
        title={`${league.name} — Community`}
        description="League posts, announcements, polls, and discussions."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/cricket/leagues/${slug}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← {league.name}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Community</span>
        {canManage && (
          <Link
            href={`/cricket/leagues/${slug}/moderation`}
            className="ml-auto inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Moderation Queue <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Announcement banners */}
      {announcements.length > 0 && (
        <div className="mb-4 space-y-2">
          {announcements.slice(0, 3).map((p) => (
            <CricketAnnouncementBanner key={p.id} post={p} />
          ))}
        </div>
      )}

      {/* Active poll preview */}
      {isCricketPollsEnabled() && polls.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Active Poll
          </h2>
          <CricketPollCard poll={polls[0]} canVote={!!user} />
          {polls.length > 1 && (
            <Link
              href={`/cricket/leagues/${slug}/polls`}
              className="mt-2 block text-xs text-sky-400 hover:underline text-right"
            >
              View all polls ({polls.length}) →
            </Link>
          )}
        </div>
      )}

      {/* Composer */}
      {canPost && tab !== "polls" && (
        <div className="mb-5">
          <CricketPostComposer
            leagueId={league.id}
            postType={canManage && tab === "announcements" ? "announcement" : "post"}
            placeholder={
              canManage && tab === "announcements"
                ? "Write an official announcement…"
                : "Share an update or start a discussion…"
            }
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Community filters">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/cricket/leagues/${slug}/community?tab=${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Feed */}
      {tab === "polls" ? (
        <div className="space-y-3">
          {polls.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <BarChart2 className="h-8 w-8 text-slate-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-slate-500">No polls yet.</p>
            </div>
          ) : (
            polls.map((poll) => (
              <CricketPollCard key={poll.id} poll={poll} canVote={!!user} />
            ))
          )}
        </div>
      ) : (
        <CricketFeed
          posts={feed}
          emptyTitle="No posts yet."
          emptyDescription={
            canPost
              ? "Be the first to post in this community."
              : "No community posts have been published yet."
          }
        />
      )}

      {/* Admin links */}
      {canManage && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-xs font-semibold text-slate-400 mb-2">Admin actions</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cricket/leagues/${slug}/polls`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <BarChart2 className="h-3 w-3" aria-hidden="true" />
              Manage Polls
            </Link>
            <Link
              href={`/cricket/leagues/${slug}/moderation`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Megaphone className="h-3 w-3" aria-hidden="true" />
              Moderation Dashboard
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
