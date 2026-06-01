import { cn } from "@/lib/utils/cn";

interface ReportVersionBadgeProps {
  version: number;
  isCurrent: boolean;
  className?: string;
}

export function ReportVersionBadge({ version, isCurrent, className }: ReportVersionBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-slate-400">v{version}</span>
      {isCurrent ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-400">
          Current
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
          Older version
        </span>
      )}
    </div>
  );
}
