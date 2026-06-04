"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import type { CricketNotification } from "@/lib/cricket/validation/notifications";
import {
  markCricketNotificationRead,
  markAllCricketNotificationsRead,
  deleteCricketNotification,
} from "@/lib/cricket/notifications/actions";

interface Props {
  notifications: CricketNotification[];
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

export function CricketNotificationList({ notifications }: Props) {
  const [items, setItems] = useState(notifications);
  const [markingAll, setMarkingAll] = useState(false);

  async function handleMarkRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    await markCricketNotificationRead(id);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await deleteCricketNotification(id);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    await markAllCricketNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setMarkingAll(false);
  }

  const unreadCount = items.filter((n) => !n.readAt).length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-10 w-10 text-slate-600 mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-300 mb-1">No notifications</p>
        <p className="text-sm text-slate-500">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">{unreadCount} unread</p>
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="h-3 w-3" aria-hidden="true" />
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </div>
      )}

      <ul className="space-y-1" aria-label="Notifications">
        {items.map((n) => {
          const isUnread = !n.readAt;
          const inner = (
            <div className={`flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${isUnread ? "bg-sky-500/5 border border-sky-500/20" : "border border-slate-800"}`}>
              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? "bg-sky-400" : "bg-transparent"}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${isUnread ? "font-semibold text-slate-100" : "text-slate-300"}`}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-xs text-slate-600 mt-1">{formatRelative(n.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {isUnread && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleMarkRead(n.id); }}
                    className="rounded p-1 text-slate-500 hover:text-sky-400 transition-colors"
                    aria-label="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(n.id); }}
                  className="rounded p-1 text-slate-600 hover:text-rose-400 transition-colors"
                  aria-label="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );

          return (
            <li key={n.id}>
              {n.actionUrl ? (
                <Link href={n.actionUrl} onClick={() => { if (isUnread) handleMarkRead(n.id); }}>
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
