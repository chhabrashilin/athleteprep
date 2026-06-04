"use client";

/**
 * lib/cricket/community/realtime.ts
 * Client-side Supabase Realtime subscriptions for community thread messages.
 * Falls back to polling every 15s if Realtime unavailable.
 * Safe for SSR — all subscriptions are guarded by typeof window.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CricketThreadMessage } from "@/lib/cricket/threads/queries";

export interface ThreadRealtimeCallbacks {
  onNewMessage?: (msg: CricketThreadMessage) => void;
  onError?: (err: unknown) => void;
}

export function subscribeToMatchThread(
  threadId: string,
  callbacks: ThreadRealtimeCallbacks
): () => void {
  if (typeof window === "undefined") return () => {};
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  let removed = false;

  const channel = supabase
    .channel(`match_thread_${threadId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "cricket_match_thread_messages",
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        if (removed) return;
        if (payload.new && callbacks.onNewMessage) {
          const row = payload.new as Record<string, unknown>;
          callbacks.onNewMessage({
            id: row.id as string,
            threadId: row.thread_id as string,
            matchId: (row.match_id as string | null) ?? null,
            authorUserId: (row.author_user_id as string | null) ?? null,
            body: row.body as string,
            messageType: (row.message_type as string) ?? "message",
            status: (row.status as string) ?? "published",
            moderationStatus: (row.moderation_status as string) ?? "approved",
            editedAt: (row.edited_at as string | null) ?? null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" && callbacks.onError) {
        callbacks.onError(new Error("Realtime channel error for thread"));
      }
    });

  return () => {
    removed = true;
    supabase.removeChannel(channel);
  };
}

interface UseMatchThreadMessagesOptions {
  pollIntervalMs?: number;
  initialMessages?: CricketThreadMessage[];
}

export function useMatchThreadMessages(
  threadId: string | null,
  options: UseMatchThreadMessagesOptions = {}
) {
  const { pollIntervalMs = 15000, initialMessages = [] } = options;
  const [messages, setMessages] = useState<CricketThreadMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!threadId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { data } = await supabase
      .from("cricket_match_thread_messages")
      .select("*")
      .eq("thread_id", threadId)
      .eq("status", "published")
      .in("moderation_status", ["approved", "flagged"])
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) {
      setMessages(
        (data as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          threadId: row.thread_id as string,
          matchId: (row.match_id as string | null) ?? null,
          authorUserId: (row.author_user_id as string | null) ?? null,
          body: row.body as string,
          messageType: (row.message_type as string) ?? "message",
          status: (row.status as string) ?? "published",
          moderationStatus: (row.moderation_status as string) ?? "approved",
          editedAt: (row.edited_at as string | null) ?? null,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        }))
      );
    }
  }, [threadId]);

  useEffect(() => {
    if (typeof window === "undefined" || !threadId) return;

    let realtimeWorking = false;

    const unsub = subscribeToMatchThread(threadId, {
      onNewMessage: (msg) => {
        realtimeWorking = true;
        setIsConnected(true);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      onError: () => setIsConnected(false),
    });

    unsubRef.current = unsub;

    const initialTimer = setTimeout(() => { void fetchLatest(); }, 0);

    pollTimerRef.current = setInterval(() => {
      if (!realtimeWorking) void fetchLatest();
    }, pollIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      unsub();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [threadId, pollIntervalMs, fetchLatest]);

  return { messages, setMessages, isConnected };
}
