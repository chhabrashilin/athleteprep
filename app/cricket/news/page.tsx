import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCricketCommunityFeed } from "@/lib/cricket/community/queries";
import { CricketFeed } from "@/components/cricket/CricketFeed";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";
import { isCricketNewsEnabled } from "@/lib/config/feature-flags";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "Cricket News — GameIQ" };

export default async function CricketNewsPage() {
  if (!isCricketNewsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Cricket news coming soon"
          description="The news section is not yet enabled on this deployment."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const feed = await getCricketCommunityFeed({
    postType: "news",
    limit: 20,
  }).catch(() => []);

  const articles = await getCricketCommunityFeed({
    postType: "article",
    limit: 10,
  }).catch(() => []);

  const allNews = [...feed, ...articles].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt).getTime() -
      new Date(a.publishedAt ?? a.createdAt).getTime()
  );

  return (
    <AppShell>
      <PageHeader
        title="Cricket News"
        description="League news, match reports, and official articles."
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href="/cricket" className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Cricket Hub
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 flex items-start gap-3">
        <Newspaper className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs text-slate-400">
          News and articles are published by league administrators and managers.
          External news ingestion is not enabled by default.
        </p>
      </div>

      {allNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-center">
          <Newspaper className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-300 mb-1">
            No cricket news has been published yet.
          </p>
          <p className="text-sm text-slate-500 max-w-xs">
            League admins can create news and articles from the community section of their league.
          </p>
        </div>
      ) : (
        <CricketFeed posts={allNews} />
      )}
    </AppShell>
  );
}
