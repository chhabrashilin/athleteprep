import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { getServerUser } from "@/lib/supabase/server";
import { getCricketPost, getCricketPostComments } from "@/lib/cricket/community/queries";
import { CricketPostCard } from "@/components/cricket/CricketPostCard";
import { CricketCommentThread } from "@/components/cricket/CricketCommentThread";
import { isCricketNewsEnabled } from "@/lib/config/feature-flags";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";

interface Props {
  params: Promise<{ postIdOrSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postIdOrSlug } = await params;
  const post = await getCricketPost(postIdOrSlug);
  if (!post) return { title: "Article not found — GameIQ" };
  return { title: `${post.title ?? "Article"} — GameIQ` };
}

export default async function NewsArticlePage({ params }: Props) {
  if (!isCricketNewsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="News not enabled"
          description="Cricket news is not enabled on this deployment."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const { postIdOrSlug } = await params;
  const [user, post] = await Promise.all([getServerUser(), getCricketPost(postIdOrSlug)]);
  if (!post || post.status !== "published" || post.moderationStatus === "removed") notFound();

  const comments = post.allowComments ? await getCricketPostComments(post.id) : [];

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href="/cricket/news" className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Cricket News
        </Link>
      </div>

      <CricketPostCard post={post} expanded />

      {post.allowComments && (
        <div className="mt-6">
          <CricketCommentThread
            postId={post.id}
            comments={comments}
            canComment={!!user}
          />
        </div>
      )}
    </AppShell>
  );
}
