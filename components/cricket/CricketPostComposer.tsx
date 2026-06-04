"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { createCricketPost } from "@/lib/cricket/community/actions";

interface Props {
  spaceId?: string;
  leagueId?: string;
  teamId?: string;
  matchId?: string;
  postType?: string;
  placeholder?: string;
  onSuccess?: (postId: string) => void;
}

const MAX_BODY = parseInt(process.env.NEXT_PUBLIC_CRICKET_MAX_POST_LENGTH ?? "3000", 10) || 3000;

export function CricketPostComposer({
  spaceId,
  leagueId,
  teamId,
  matchId,
  postType = "post",
  placeholder = "Share an update, insight, or announcement…",
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTitle, setShowTitle] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setWarning(null);

    const result = await createCricketPost({
      space_id: spaceId,
      league_id: leagueId,
      team_id: teamId,
      match_id: matchId,
      post_type: postType,
      title: title.trim() || null,
      body: body.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      setTitle("");
      setBody("");
      setShowTitle(false);
      if (result.warnings?.length) setWarning(result.warnings[0]);
      if (result.data?.id && onSuccess) onSuccess(result.data.id);
    } else {
      setError(result.error ?? "Failed to post");
    }
  }

  const remaining = MAX_BODY - body.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
      aria-label="Create post"
    >
      {showTitle && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={160}
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          aria-label="Post title"
        />
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={MAX_BODY}
        required
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
        aria-label="Post body"
        aria-describedby={error ? "composer-error" : warning ? "composer-warning" : undefined}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTitle((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showTitle ? "Remove title" : "+ Add title"}
          </button>
          <span
            className={`text-xs ${remaining < 100 ? "text-amber-400" : "text-slate-600"}`}
            aria-live="polite"
          >
            {remaining} characters remaining
          </span>
        </div>

        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          <Send className="h-3 w-3" aria-hidden="true" />
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>

      {error && (
        <p id="composer-error" className="mt-2 text-xs text-rose-400" role="alert">
          {error}
        </p>
      )}
      {warning && (
        <p id="composer-warning" className="mt-2 text-xs text-amber-400" role="status">
          {warning}
        </p>
      )}
    </form>
  );
}
