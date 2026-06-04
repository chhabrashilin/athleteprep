interface Props {
  status: string;
  className?: string;
}

const CONFIG: Record<string, { label: string; color: string; symbol: string }> = {
  pending: {
    label: "Pending moderation",
    color: "text-amber-400 bg-amber-400/10 border-amber-500/30",
    symbol: "⏳",
  },
  approved: {
    label: "Approved",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
    symbol: "✓",
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-400 bg-rose-400/10 border-rose-500/30",
    symbol: "✗",
  },
  flagged: {
    label: "Flagged for review",
    color: "text-orange-400 bg-orange-400/10 border-orange-500/30",
    symbol: "⚑",
  },
  removed: {
    label: "Removed",
    color: "text-rose-600 bg-rose-600/10 border-rose-700/30",
    symbol: "✗",
  },
};

export function CricketModerationBadge({ status, className = "" }: Props) {
  const cfg = CONFIG[status];
  if (!cfg || status === "approved") return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${cfg.color} ${className}`}
      role="status"
      aria-label={cfg.label}
    >
      <span aria-hidden="true">{cfg.symbol}</span>
      {cfg.label}
    </span>
  );
}
