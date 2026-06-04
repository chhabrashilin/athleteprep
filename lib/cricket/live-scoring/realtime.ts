"use client";

/**
 * lib/cricket/live-scoring/realtime.ts
 * Client-side Supabase Realtime subscriptions for live match state.
 * Falls back to polling if Realtime is unavailable.
 * Must not crash during SSR.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CricketLiveMatchState, CricketBallEvent } from "./queries";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveMatchCallbacks {
  onStateChange?: (state: CricketLiveMatchState) => void;
  onNewEvent?: (event: CricketBallEvent) => void;
  onError?: (err: unknown) => void;
}

// ─── subscribeToLiveMatch ─────────────────────────────────────────────────────

/**
 * Subscribe to live match state and ball events for a match.
 * Returns an unsubscribe function.
 * Falls back to polling every 12s if Realtime channel cannot be established.
 */
export function subscribeToLiveMatch(
  matchId: string,
  callbacks: LiveMatchCallbacks
): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};

  let removed = false;

  const channel = supabase
    .channel(`live_match_${matchId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "cricket_live_match_state",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (removed) return;
        if (payload.new && callbacks.onStateChange) {
          callbacks.onStateChange(payload.new as unknown as CricketLiveMatchState);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "cricket_ball_events",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (removed) return;
        if (payload.new && callbacks.onNewEvent) {
          callbacks.onNewEvent(payload.new as unknown as CricketBallEvent);
        }
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" && callbacks.onError) {
        callbacks.onError(new Error("Realtime channel error"));
      }
    });

  return () => {
    removed = true;
    supabase.removeChannel(channel);
  };
}

// ─── useLiveMatchState ────────────────────────────────────────────────────────

interface UseLiveMatchStateOptions {
  /** Fallback polling interval in ms. Defaults to 12000 (12s). */
  pollIntervalMs?: number;
  initialState?: CricketLiveMatchState | null;
  initialEvents?: CricketBallEvent[];
}

interface UseLiveMatchStateResult {
  liveState: CricketLiveMatchState | null;
  recentEvents: CricketBallEvent[];
  isConnected: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

/**
 * React hook that subscribes to live match state.
 * Uses Supabase Realtime with 12s polling fallback.
 * Safe for SSR (returns defaults until mounted client-side).
 */
export function useLiveMatchState(
  matchId: string,
  options: UseLiveMatchStateOptions = {}
): UseLiveMatchStateResult {
  const { pollIntervalMs = 12000, initialState = null, initialEvents = [] } = options;

  const [liveState, setLiveState] = useState<CricketLiveMatchState | null>(initialState);
  const [recentEvents, setRecentEvents] = useState<CricketBallEvent[]>(initialEvents);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const fetchLatest = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const [{ data: stateData }, { data: eventsData }] = await Promise.all([
      supabase
        .from("cricket_live_match_state")
        .select("*")
        .eq("match_id", matchId)
        .maybeSingle(),
      supabase
        .from("cricket_ball_events")
        .select("*")
        .eq("match_id", matchId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(24),
    ]);

    if (stateData) setLiveState(stateData as unknown as CricketLiveMatchState);
    if (eventsData) setRecentEvents((eventsData as unknown as CricketBallEvent[]).reverse());
    setLastUpdated(new Date());
  }, [matchId]);

  useEffect(() => {
    // Guard: skip during SSR
    if (typeof window === "undefined") return;

    let realtimeWorking = false;

    const unsub = subscribeToLiveMatch(matchId, {
      onStateChange: (state) => {
        realtimeWorking = true;
        setLiveState(state);
        setIsConnected(true);
        setLastUpdated(new Date());
      },
      onNewEvent: (event) => {
        realtimeWorking = true;
        setRecentEvents((prev) => {
          const updated = [...prev.filter((e) => e.id !== event.id), event];
          return updated.slice(-24);
        });
        setLastUpdated(new Date());
      },
      onError: () => {
        setIsConnected(false);
      },
    });

    unsubRef.current = unsub;

    // Initial fetch deferred to avoid synchronous setState inside effect body
    const initialTimer = setTimeout(() => { void fetchLatest(); }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot

    // Polling fallback — always run it; realtime is additive
    pollTimerRef.current = setInterval(() => {
      if (!realtimeWorking) {
        fetchLatest();
      }
    }, pollIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      unsub();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [matchId, pollIntervalMs, fetchLatest]);

  const refresh = useCallback(() => { fetchLatest(); }, [fetchLatest]);

  return { liveState, recentEvents, isConnected, lastUpdated, refresh };
}
