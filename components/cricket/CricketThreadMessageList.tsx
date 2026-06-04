import type { CricketThreadMessage } from "@/lib/cricket/threads/queries";
import { CricketModerationBadge } from "./CricketModerationBadge";

interface Props {
  messages: CricketThreadMessage[];
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

export function CricketThreadMessageList({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-4 text-center">
        No messages yet. Be the first to comment.
      </p>
    );
  }

  return (
    <ul className="space-y-2" role="log" aria-live="polite" aria-label="Thread messages">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.messageType === "system"
              ? "text-slate-500 text-xs text-center bg-slate-800/40"
              : msg.messageType === "admin_notice"
              ? "border border-sky-500/30 bg-sky-500/10 text-sky-300"
              : msg.messageType === "scorer_update"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {msg.messageType === "admin_notice" && (
            <p className="text-xs font-semibold text-sky-400 mb-0.5">Admin Notice</p>
          )}
          {msg.messageType === "scorer_update" && (
            <p className="text-xs font-semibold text-emerald-400 mb-0.5">Score Update</p>
          )}
          <p className="whitespace-pre-wrap">{msg.body}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-600">{formatRelative(msg.createdAt)}</span>
            <CricketModerationBadge status={msg.moderationStatus} />
          </div>
        </li>
      ))}
    </ul>
  );
}
