import { cn } from "@/lib/utils/cn";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import type { AnalysisJob } from "@/types/database";

interface AnalysisJobStatusCardProps {
  job: AnalysisJob;
  className?: string;
}

const JOB_CONFIG = {
  pending: {
    label: "Queued",
    description: "The analysis job is queued and will begin shortly.",
    icon: Clock,
    iconColor: "text-slate-400",
    borderColor: "border-slate-700",
    bgColor: "bg-slate-900",
  },
  running: {
    label: "Generating…",
    description: "The AI is analyzing your game data. This takes a few seconds.",
    icon: Loader2,
    iconColor: "text-sky-400 animate-spin",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-500/5",
  },
  completed: {
    label: "Completed",
    description: "Analysis complete. View your report below.",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
  },
  failed: {
    label: "Failed",
    description: "Report generation failed. You can try again.",
    icon: XCircle,
    iconColor: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
  },
};

export function AnalysisJobStatusCard({ job, className }: AnalysisJobStatusCardProps) {
  const config = JOB_CONFIG[job.status] ?? JOB_CONFIG.pending;
  const Icon = config.icon;

  const completedAt = job.completedAt
    ? new Date(job.completedAt).toLocaleString()
    : null;
  const failedAt = job.failedAt
    ? new Date(job.failedAt).toLocaleString()
    : null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-100">{config.label}</p>
          <span className="text-xs text-slate-500">
            {job.provider} · {completedAt ?? failedAt ?? "in progress"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
        {job.errorMessage && (
          <p className="mt-2 text-xs text-red-400 font-mono bg-red-500/10 rounded px-2 py-1">
            {job.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
