import { Megaphone, X } from "lucide-react";
import type { CricketPost } from "@/lib/cricket/community/queries";
import { buildCommunityExcerpt } from "@/lib/cricket/community/safety";

interface Props {
  post: CricketPost;
  onDismiss?: () => void;
}

export function CricketAnnouncementBanner({ post, onDismiss }: Props) {
  const excerpt = buildCommunityExcerpt(post.body, 200);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3"
    >
      <Megaphone className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {post.title && (
          <p className="text-sm font-semibold text-sky-300 mb-0.5">{post.title}</p>
        )}
        <p className="text-sm text-slate-300">{excerpt}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 shrink-0 rounded p-0.5 text-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
