"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  initialCount?: number;
  href?: string;
}

export function CricketNotificationBell({ initialCount = 0, href = "/cricket/notifications" }: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cleanup: (() => void) | undefined;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel("cricket_notifications_bell")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "cricket_notifications",
            filter: `recipient_user_id=eq.${user.id}`,
          },
          () => {
            setCount((prev) => prev + 1);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "cricket_notifications",
            filter: `recipient_user_id=eq.${user.id}`,
          },
          (payload) => {
            if ((payload.new as { read_at: string | null }).read_at) {
              setCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      cleanup = () => { supabase.removeChannel(channel); };
    });

    return () => { cleanup?.(); };
  }, []);

  return (
    <Link
      href={href}
      className="relative inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white leading-none"
          aria-hidden="true"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
