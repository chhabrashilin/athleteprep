/**
 * tests/components/community-components.test.tsx
 * Smoke tests for community UI components.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CricketCommunityEmptyState } from "@/components/cricket/CricketCommunityEmptyState";
import { CricketVisibilityBadge } from "@/components/cricket/CricketVisibilityBadge";
import { CricketModerationBadge } from "@/components/cricket/CricketModerationBadge";
import { CricketAnnouncementBanner } from "@/components/cricket/CricketAnnouncementBanner";
import { CricketPostCard } from "@/components/cricket/CricketPostCard";
import { CricketFeed } from "@/components/cricket/CricketFeed";
import { CricketPollResults } from "@/components/cricket/CricketPollCard";
import { CricketNotificationList } from "@/components/cricket/CricketNotificationList";
import type { CricketPost } from "@/lib/cricket/community/queries";
import type { PollResults } from "@/lib/cricket/validation/polls";
import type { CricketNotification } from "@/lib/cricket/validation/notifications";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/cricket/notifications/actions", () => ({
  markCricketNotificationRead: vi.fn().mockResolvedValue({ success: true }),
  markAllCricketNotificationsRead: vi.fn().mockResolvedValue({ success: true }),
  deleteCricketNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode } & Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePost(overrides: Partial<CricketPost> = {}): CricketPost {
  return {
    id: "post-1",
    spaceId: null,
    leagueId: "league-1",
    teamId: null,
    matchId: null,
    authorUserId: "user-1",
    authorPlayerId: null,
    postType: "post",
    title: "Test post title",
    body: "This is the post body content.",
    mediaUrls: [],
    linkUrl: null,
    visibility: "league",
    status: "published",
    pinned: false,
    featured: false,
    allowComments: true,
    moderationStatus: "approved",
    publishedAt: new Date().toISOString(),
    editedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  };
}

function makeNotification(overrides: Partial<CricketNotification> = {}): CricketNotification {
  return {
    id: "notif-1",
    recipientUserId: "user-1",
    actorUserId: null,
    leagueId: null,
    teamId: null,
    matchId: null,
    notificationType: "announcement.created",
    title: "New announcement",
    body: null,
    actionUrl: "/cricket/news/123",
    readAt: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── CricketCommunityEmptyState ───────────────────────────────────────────────

describe("CricketCommunityEmptyState", () => {
  it("renders default title and description", () => {
    render(<CricketCommunityEmptyState />);
    expect(screen.getByText("No community posts yet.")).toBeTruthy();
    expect(screen.getByText("Be the first to post in this community.")).toBeTruthy();
  });

  it("renders custom title", () => {
    render(<CricketCommunityEmptyState title="No news yet" description="Check back later." />);
    expect(screen.getByText("No news yet")).toBeTruthy();
  });

  it("renders optional action slot", () => {
    render(<CricketCommunityEmptyState action={<button>Post now</button>} />);
    expect(screen.getByText("Post now")).toBeTruthy();
  });
});

// ─── CricketVisibilityBadge ───────────────────────────────────────────────────

describe("CricketVisibilityBadge", () => {
  it("renders 'Public' for public visibility", () => {
    render(<CricketVisibilityBadge visibility="public" />);
    expect(screen.getByText("Public")).toBeTruthy();
  });

  it("renders 'Private' for private visibility", () => {
    render(<CricketVisibilityBadge visibility="private" />);
    expect(screen.getByText("Private")).toBeTruthy();
  });

  it("renders 'League' for league visibility", () => {
    render(<CricketVisibilityBadge visibility="league" />);
    expect(screen.getByText("League")).toBeTruthy();
  });

  it("has accessible aria-label", () => {
    render(<CricketVisibilityBadge visibility="public" />);
    expect(screen.getByLabelText("Visibility: Public")).toBeTruthy();
  });
});

// ─── CricketModerationBadge ───────────────────────────────────────────────────

describe("CricketModerationBadge", () => {
  it("renders nothing for approved status", () => {
    const { container } = render(<CricketModerationBadge status="approved" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders pending badge", () => {
    render(<CricketModerationBadge status="pending" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByLabelText("Pending moderation")).toBeTruthy();
  });

  it("renders flagged badge", () => {
    render(<CricketModerationBadge status="flagged" />);
    expect(screen.getByLabelText("Flagged for review")).toBeTruthy();
  });
});

// ─── CricketAnnouncementBanner ────────────────────────────────────────────────

describe("CricketAnnouncementBanner", () => {
  it("renders post body as excerpt", () => {
    const post = makePost({ postType: "announcement", body: "Big news for the league!" });
    render(<CricketAnnouncementBanner post={post} />);
    expect(screen.getByText("Big news for the league!")).toBeTruthy();
  });

  it("renders title if present", () => {
    const post = makePost({ title: "Important Announcement", body: "Details here." });
    render(<CricketAnnouncementBanner post={post} />);
    expect(screen.getByText("Important Announcement")).toBeTruthy();
  });

  it("renders dismiss button when onDismiss provided", () => {
    const post = makePost({ body: "Some news" });
    render(<CricketAnnouncementBanner post={post} onDismiss={() => {}} />);
    expect(screen.getByLabelText("Dismiss announcement")).toBeTruthy();
  });

  it("has role=alert for accessibility", () => {
    const post = makePost({ body: "Alert content" });
    render(<CricketAnnouncementBanner post={post} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

// ─── CricketPostCard ──────────────────────────────────────────────────────────

describe("CricketPostCard", () => {
  it("renders post body", () => {
    render(<CricketPostCard post={makePost()} />);
    expect(screen.getByText("This is the post body content.")).toBeTruthy();
  });

  it("renders title when present", () => {
    render(<CricketPostCard post={makePost({ title: "My Title" })} />);
    expect(screen.getByText("My Title")).toBeTruthy();
  });

  it("renders pinned indicator for pinned posts", () => {
    render(<CricketPostCard post={makePost({ pinned: true })} />);
    expect(screen.getByText("Pinned")).toBeTruthy();
  });

  it("renders announcement badge for announcement type", () => {
    render(<CricketPostCard post={makePost({ postType: "announcement" })} />);
    expect(screen.getByText("Announcement")).toBeTruthy();
  });

  it("does not render pending badge for approved posts", () => {
    render(<CricketPostCard post={makePost({ moderationStatus: "approved" })} />);
    expect(screen.queryByLabelText("Pending moderation")).toBeNull();
  });

  it("renders pending badge for pending moderation", () => {
    render(<CricketPostCard post={makePost({ moderationStatus: "pending" })} />);
    expect(screen.getByLabelText("Pending moderation")).toBeTruthy();
  });
});

// ─── CricketFeed ─────────────────────────────────────────────────────────────

describe("CricketFeed", () => {
  it("renders empty state when no posts", () => {
    render(<CricketFeed posts={[]} />);
    expect(screen.getByText("No community posts yet.")).toBeTruthy();
  });

  it("renders custom empty title", () => {
    render(<CricketFeed posts={[]} emptyTitle="No news yet." />);
    expect(screen.getByText("No news yet.")).toBeTruthy();
  });

  it("renders post cards for each post", () => {
    const posts = [
      makePost({ id: "1", body: "First post" }),
      makePost({ id: "2", body: "Second post" }),
    ];
    render(<CricketFeed posts={posts} />);
    expect(screen.getByText("First post")).toBeTruthy();
    expect(screen.getByText("Second post")).toBeTruthy();
  });

  it("renders feed with role=feed", () => {
    render(<CricketFeed posts={[makePost()]} />);
    expect(screen.getByRole("feed")).toBeTruthy();
  });
});

// ─── CricketPollResults ───────────────────────────────────────────────────────

describe("CricketPollResults", () => {
  const results: PollResults = {
    poll_id: "poll-1",
    question: "Who wins?",
    total_votes: 10,
    status: "open",
    closes_at: null,
    options: [
      { option_id: "opt-1", option_text: "Team A", sort_order: 0, vote_count: 7, percentage: 70 },
      { option_id: "opt-2", option_text: "Team B", sort_order: 1, vote_count: 3, percentage: 30 },
    ],
    user_voted_option_ids: ["opt-1"],
  };

  it("renders option texts", () => {
    render(<CricketPollResults results={results} />);
    expect(screen.getByText("Team A")).toBeTruthy();
    expect(screen.getByText("Team B")).toBeTruthy();
  });

  it("renders percentage values", () => {
    render(<CricketPollResults results={results} />);
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("30%")).toBeTruthy();
  });

  it("shows checkmark on voted option", () => {
    render(<CricketPollResults results={results} votedIds={["opt-1"]} />);
    const teamA = screen.getByLabelText("Team A: 70%");
    expect(teamA).toBeTruthy();
  });

  it("renders nothing for null results", () => {
    render(<CricketPollResults results={null} />);
    expect(screen.getByText("Results are not available.")).toBeTruthy();
  });

  it("has accessible progressbar roles", () => {
    render(<CricketPollResults results={results} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.length).toBe(2);
  });
});

// ─── CricketNotificationList ──────────────────────────────────────────────────

describe("CricketNotificationList", () => {
  it("renders empty state when no notifications", () => {
    render(<CricketNotificationList notifications={[]} />);
    expect(screen.getByText("No notifications")).toBeTruthy();
  });

  it("renders notification title", () => {
    render(<CricketNotificationList notifications={[makeNotification()]} />);
    expect(screen.getByText("New announcement")).toBeTruthy();
  });

  it("renders mark all read button when unread count > 0", () => {
    render(<CricketNotificationList notifications={[makeNotification({ readAt: null })]} />);
    expect(screen.getByText("Mark all read")).toBeTruthy();
  });

  it("does not render mark all read when all read", () => {
    render(
      <CricketNotificationList
        notifications={[makeNotification({ readAt: new Date().toISOString() })]}
      />
    );
    expect(screen.queryByText("Mark all read")).toBeNull();
  });

  it("renders unread count", () => {
    render(
      <CricketNotificationList
        notifications={[
          makeNotification({ id: "1", readAt: null }),
          makeNotification({ id: "2", readAt: null }),
        ]}
      />
    );
    expect(screen.getByText("2 unread")).toBeTruthy();
  });
});
