"use client";

/**
 * lib/cricket/notifications/realtime.ts
 * Client-side Supabase Realtime subscription for the notification bell.
 * Falls back to periodic polling if Realtime unavailable.
 * Safe for SSR.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface UseUnreadNotificationCountOptions {
  userId: string | null;
  initialCount?: number;
  pollIntervalMs?: number;
}

export function useUnreadNotificationCount({
  userId,
  initialCount = 0,
  pollIntervalMs = 30000,
}: UseUnreadNotificationCountOptions) {
  const [count, setCount] = useState(initialCount);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { count: unread } = await supabase
      .from("cricket_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", userId)
      .is("read_at", null);

    if (typeof unread === "number") setCount(unread);
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let realtimeWorking = false;

    const channel = supabase
      .channel(`notifications_count_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cricket_notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          realtimeWorking = true;
          setCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cricket_notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          realtimeWorking = true;
          if ((payload.new as { read_at: string | null }).read_at) {
            setCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    const initialTimer = setTimeout(() => { void fetchCount(); }, 0);

    pollTimerRef.current = setInterval(() => {
      if (!realtimeWorking) void fetchCount();
    }, pollIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      supabase.removeChannel(channel);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [userId, pollIntervalMs, fetchCount]);

  return { count, setCount };
}
