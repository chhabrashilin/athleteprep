import { cn } from "@/lib/utils/cn";
import type { EventImportance } from "@/types/sports";

const CONFIG: Record<
  EventImportance,
  { label: string; className: string }
> = {
  critical: {
    label: "Critical",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  high: {
    label: "High",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  medium: {
    label: "Medium",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  low: {
    label: "Low",
    className: "bg-slate-700/60 text-slate-400 border-slate-600/50",
  },
};

interface EventImportanceBadgeProps {
  importance: EventImportance;
  className?: string;
}

export function EventImportanceBadge({ importance, className }: EventImportanceBadgeProps) {
  const config = CONFIG[importance] ?? CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
