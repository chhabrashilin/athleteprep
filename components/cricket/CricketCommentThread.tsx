"use client";

import { useState } from "react";
import { MessageSquare, Reply } from "lucide-react";
import type { CricketComment } from "@/lib/cricket/community/queries";
import { createCricketComment } from "@/lib/cricket/community/actions";
import { CricketModerationBadge } from "./CricketModerationBadge";

interface Props {
  postId: string;
  comments: CricketComment[];
  canComment: boolean;
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return iso;
  }
}

function CommentItem({
  comment,
  postId,
  canComment,
}: {
  comment: CricketComment;
  postId: string;
  canComment: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || submitting) return;
    setSubmitting(true);
    const result = await createCricketComment({
      post_id: postId,
      parent_comment_id: comment.id,
      body: replyBody.trim(),
    });
    setSubmitting(false);
    if (result.success) {
      setReplyBody("");
      setReplying(false);
    } else {
      setError(result.error ?? "Failed to reply");
    }
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-slate-700 flex items-center justify-center">
        <MessageSquare className="h-3 w-3 text-slate-500" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-300">Community member</span>
          <span className="text-xs text-slate-600">{formatRelative(comment.createdAt)}</span>
          <CricketModerationBadge status={comment.moderationStatus} />
        </div>
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.body}</p>

        {canComment && !replying && (
          <button
            onClick={() => setReplying(true)}
            className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            <Reply className="h-3 w-3" aria-hidden="true" />
            Reply
          </button>
        )}

        {replying && (
          <form onSubmit={handleReply} className="mt-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
              aria-label="Reply body"
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
            <div className="mt-1.5 flex gap-2">
              <button
                type="submit"
                disabled={!replyBody.trim() || submitting}
                className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {submitting ? "Posting…" : "Reply"}
              </button>
              <button
                type="button"
                onClick={() => { setReplying(false); setReplyBody(""); setError(null); }}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function CricketCommentThread({ postId, comments, canComment }: Props) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<CricketComment[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await createCricketComment({ post_id: postId, body: body.trim() });
    setSubmitting(false);

    if (result.success) {
      // Add optimistic comment.
      setOptimistic((prev) => [
        ...prev,
        {
          id: result.data?.id ?? crypto.randomUUID(),
          postId,
          parentCommentId: null,
          authorUserId: null,
          body: body.trim(),
          status: "published",
          moderationStatus: "approved",
          editedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setBody("");
    } else {
      setError(result.error ?? "Failed to comment");
    }
  }

  const allComments = [...comments, ...optimistic];

  return (
    <div className="mt-4" aria-label="Comments">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Comments ({allComments.length})
      </h4>

      {allComments.length === 0 && (
        <p className="text-xs text-slate-500 mb-4">No comments yet. Be the first to comment.</p>
      )}

      <div className="space-y-4 mb-4">
        {allComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            canComment={canComment}
          />
        ))}
      </div>

      {canComment && (
        <form onSubmit={handleSubmit} aria-label="Add comment">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
            aria-label="Comment body"
          />
          {error && <p className="text-xs text-rose-400 mt-1" role="alert">{error}</p>}
          <div className="mt-1.5 flex justify-end">
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Comment"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
