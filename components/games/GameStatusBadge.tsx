import { cn } from "@/lib/utils/cn";
import type { GameStatus } from "@/types/database";

interface GameStatusBadgeProps {
  status: GameStatus | string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:              { label: "Draft",       className: "bg-slate-700/60 text-slate-400 border-slate-600" },
  ready_for_analysis: { label: "Ready",       className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  analysis_running:   { label: "Analyzing",   className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  analyzed:           { label: "Analyzed",    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  archived:           { label: "Archived",    className: "bg-slate-800/60 text-slate-600 border-slate-700/50" },
};

export function GameStatusBadge({ status, className }: GameStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
