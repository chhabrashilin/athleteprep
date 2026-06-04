import { cn } from "@/lib/utils/cn";

export type CricketModuleStatus = "available" | "foundation_ready" | "coming_soon";

const STATUS_CONFIG: Record<
  CricketModuleStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  foundation_ready: {
    label: "Foundation Ready",
    className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  coming_soon: {
    label: "Coming Soon",
    className: "bg-slate-800/60 text-slate-500 border-slate-700/50",
  },
};

interface CricketStatusBadgeProps {
  status: CricketModuleStatus;
  className?: string;
}

export function CricketStatusBadge({ status, className }: CricketStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
