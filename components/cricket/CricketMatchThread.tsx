"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Lock, Pin } from "lucide-react";
import type { CricketMatchThread as Thread, CricketThreadMessage } from "@/lib/cricket/threads/queries";
import { postMatchThreadMessage } from "@/lib/cricket/threads/actions";
import { CricketModerationBadge } from "./CricketModerationBadge";
import { createOrGetMatchThread } from "@/lib/cricket/threads/actions";

interface Props {
  matchId: string;
  thread: Thread | null;
  initialMessages: CricketThreadMessage[];
  canPost: boolean;
  isModerator?: boolean;
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

export function CricketMatchThread({ matchId, thread, initialMessages, canPost, isModerator = false }: Props) {
  const [messages, setMessages] = useState<CricketThreadMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState(thread);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function ensureThread(): Promise<string | null> {
    if (currentThread) return currentThread.id;
    const result = await createOrGetMatchThread(matchId);
    if (result.success && result.data) {
      setCurrentThread({ id: result.data.id, matchId, leagueId: null, title: result.data.title, visibility: "league", status: "open", slowModeSeconds: 0, pinnedMessage: null, createdBy: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      return result.data.id;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setWarning(null);

    const threadId = await ensureThread();
    if (!threadId) {
      setError("Could not open match thread");
      setSubmitting(false);
      return;
    }

    const result = await postMatchThreadMessage({
      thread_id: threadId,
      match_id: matchId,
      body: body.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      // Optimistic add.
      const optimistic: CricketThreadMessage = {
        id: result.data?.id ?? crypto.randomUUID(),
        threadId,
        matchId,
        authorUserId: null,
        body: body.trim(),
        messageType: "message",
        status: "published",
        moderationStatus: "approved",
        editedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setBody("");
      if (result.warnings?.length) setWarning(result.warnings[0]);
    } else {
      setError(result.error ?? "Failed to post message");
    }
  }

  const isLocked = currentThread?.status === "locked";

  return (
    <div className="flex flex-col h-full min-h-0" aria-label="Match thread">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-semibold text-slate-200">
          {currentThread?.title ?? "Match Thread"}
        </h3>
        {isLocked && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Locked
          </span>
        )}
      </div>

      {/* Pinned message */}
      {currentThread?.pinnedMessage && (
        <div className="flex items-start gap-2 border-b border-slate-800 bg-amber-500/5 px-4 py-2 shrink-0">
          <Pin className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-300">{currentThread.pinnedMessage}</p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0"
        role="log"
        aria-live="polite"
        aria-label="Thread messages"
      >
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.messageType === "system"
                ? "bg-slate-800/50 text-slate-500 text-xs text-center"
                : msg.messageType === "admin_notice"
                ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {msg.messageType === "admin_notice" && (
              <p className="text-xs font-semibold text-sky-400 mb-0.5">Admin Notice</p>
            )}
            <p className="whitespace-pre-wrap">{msg.body}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-600">{formatRelative(msg.createdAt)}</span>
              <CricketModerationBadge status={msg.moderationStatus} />
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {canPost && !isLocked && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-800 px-4 py-3 shrink-0"
          aria-label="Post thread message"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add to the conversation…"
              maxLength={1000}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              aria-label="Thread message"
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-rose-400" role="alert">{error}</p>}
          {warning && <p className="mt-1 text-xs text-amber-400" role="status">{warning}</p>}
        </form>
      )}

      {!canPost && (
        <div className="border-t border-slate-800 px-4 py-3 shrink-0">
          <p className="text-xs text-slate-500 text-center">
            Sign in as a league member to join the conversation.
          </p>
        </div>
      )}

      {isLocked && (
        <div className="border-t border-slate-800 px-4 py-3 shrink-0">
          <p className="text-xs text-slate-500 text-center">
            This thread has been locked by a moderator.
          </p>
        </div>
      )}
    </div>
  );
}
