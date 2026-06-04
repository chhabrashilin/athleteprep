import type { CricketPost } from "@/lib/cricket/community/queries";
import { CricketPostCard } from "./CricketPostCard";
import { CricketCommunityEmptyState } from "./CricketCommunityEmptyState";

interface Props {
  posts: CricketPost[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  renderFooter?: (post: CricketPost) => React.ReactNode;
}

export function CricketFeed({
  posts,
  emptyTitle,
  emptyDescription,
  emptyAction,
  renderFooter,
}: Props) {
  if (posts.length === 0) {
    return (
      <CricketCommunityEmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label="Community feed">
      {posts.map((post) => (
        <CricketPostCard
          key={post.id}
          post={post}
          footer={renderFooter ? renderFooter(post) : undefined}
        />
      ))}
    </div>
  );
}
