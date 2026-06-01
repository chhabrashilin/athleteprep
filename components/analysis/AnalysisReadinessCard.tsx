import { CheckCircle2, Circle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AnalysisReadiness } from "@/types/analysis";

interface AnalysisReadinessCardProps {
  readiness: AnalysisReadiness;
  className?: string;
}

const STATUS_CONFIG = {
  not_ready: {
    label: "Not ready for analysis",
    color: "border-red-500/30 bg-red-500/5",
    labelColor: "text-red-400",
    icon: AlertCircle,
    iconColor: "text-red-400",
  },
  needs_context: {
    label: "More context recommended",
    color: "border-amber-500/30 bg-amber-500/5",
    labelColor: "text-amber-400",
    icon: AlertCircle,
    iconColor: "text-amber-400",
  },
  ready: {
    label: "Ready for AI analysis",
    color: "border-sky-500/30 bg-sky-500/5",
    labelColor: "text-sky-400",
    icon: Info,
    iconColor: "text-sky-400",
  },
  strong: {
    label: "Strong evidence base",
    color: "border-emerald-500/30 bg-emerald-500/5",
    labelColor: "text-emerald-400",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
};

const CHECK_LABELS = {
  gameDetails: "Game details",
  roster: "Active roster",
  video: "Video uploaded",
  events: "Key moments tagged",
  notes: "Coach notes added",
};

export function AnalysisReadinessCard({
  readiness,
  className,
}: AnalysisReadinessCardProps) {
  const config = STATUS_CONFIG[readiness.status];
  const Icon = config.icon;

  const completedCount = Object.values(readiness.completedChecks).filter(Boolean).length;
  const totalCount = Object.keys(readiness.completedChecks).length;

  return (
    <div className={cn("rounded-xl border p-5", config.color, className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className={cn("h-5 w-5 shrink-0", config.iconColor)} />
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", config.labelColor)}>
            {config.label}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {totalCount} checks complete
          </p>
        </div>
      </div>

      {/* Checklist */}
      <ul className="space-y-2">
        {(Object.entries(readiness.completedChecks) as [keyof typeof CHECK_LABELS, boolean][]).map(
          ([key, done]) => (
            <li key={key} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              )}
              <span className={done ? "text-slate-400" : "text-slate-500"}>
                {CHECK_LABELS[key]}
              </span>
            </li>
          )
        )}
      </ul>

      {/* Warnings */}
      {readiness.warnings.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-slate-800/60 pt-3">
          {readiness.warnings.map((w, i) => (
            <li key={i} className="text-xs text-slate-500 flex gap-2">
              <span className="shrink-0">·</span>
              {w}
            </li>
          ))}
        </ul>
      )}

      {/* Block reasons */}
      {readiness.reasons.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-slate-800/60 pt-3">
          {readiness.reasons.map((r, i) => (
            <li key={i} className="text-xs text-red-400 flex gap-2">
              <span className="shrink-0">!</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
