import { cn } from "@/lib/utils/cn";
import { GAME_TYPE_LABELS } from "@/types/sports";
import type { GameType } from "@/types/sports";

interface GameTypeBadgeProps {
  gameType: GameType | string;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  match:        "bg-sky-500/15 text-sky-400 border-sky-500/30",
  practice:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  scrimmage:    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  film_session: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export function GameTypeBadge({ gameType, className }: GameTypeBadgeProps) {
  const label = GAME_TYPE_LABELS[gameType as GameType] ?? gameType;
  const colorClass = TYPE_COLORS[gameType] ?? "bg-slate-700/60 text-slate-400 border-slate-600";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
