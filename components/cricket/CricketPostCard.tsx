import { Pin, Megaphone, Clock } from "lucide-react";
import type { CricketPost } from "@/lib/cricket/community/queries";
import { buildCommunityExcerpt } from "@/lib/cricket/community/safety";
import { CricketModerationBadge } from "./CricketModerationBadge";
import { CricketVisibilityBadge } from "./CricketVisibilityBadge";

interface Props {
  post: CricketPost;
  /** Show full body instead of excerpt. */
  expanded?: boolean;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function CricketPostCard({ post, expanded = false, action, footer }: Props) {
  const body = expanded ? post.body : buildCommunityExcerpt(post.body, 240);
  const isAnnouncement = post.postType === "announcement" || post.postType === "admin_notice";

  return (
    <article
      className={`rounded-xl border bg-slate-900 p-4 ${
        isAnnouncement
          ? "border-sky-500/30"
          : post.pinned
          ? "border-amber-500/30"
          : "border-slate-800"
      }`}
      aria-label={post.title ?? "Community post"}
    >
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {post.pinned && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
            <Pin className="h-3 w-3" aria-hidden="true" />
            Pinned
          </span>
        )}
        {isAnnouncement && (
          <span className="inline-flex items-center gap-1 text-xs text-sky-400 font-medium">
            <Megaphone className="h-3 w-3" aria-hidden="true" />
            Announcement
          </span>
        )}
        <CricketModerationBadge status={post.moderationStatus} />
        <CricketVisibilityBadge visibility={post.visibility} />
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-base font-semibold text-slate-100 mb-1">{post.title}</h3>
      )}

      {/* Body */}
      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{body}</p>

      {/* Link preview */}
      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate text-xs text-sky-400 hover:underline"
          aria-label={`External link: ${post.linkUrl}`}
        >
          {post.linkUrl}
        </a>
      )}

      {/* Action slot */}
      {action && <div className="mt-3">{action}</div>}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDate(post.publishedAt ?? post.createdAt)}
        </span>
        {footer}
      </div>
    </article>
  );
}
