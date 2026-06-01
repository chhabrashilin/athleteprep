import { cn } from "@/lib/utils/cn";
import { Zap, AlertCircle, TrendingUp } from "lucide-react";

type ReadinessLevel = "not_ready" | "needs_context" | "ready" | "strong";

interface ReadinessConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  className: string;
  dotColor: string;
}

const CONFIGS: Record<ReadinessLevel, ReadinessConfig> = {
  not_ready: {
    label: "Not ready",
    description: "Upload a video and add key moments to enable AI analysis.",
    icon: AlertCircle,
    className: "bg-slate-800 text-slate-400 border-slate-700",
    dotColor: "text-slate-500",
  },
  needs_context: {
    label: "Needs context",
    description: "Video uploaded. Add key moments to improve AI report quality.",
    icon: AlertCircle,
    className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dotColor: "text-amber-400",
  },
  ready: {
    label: "Ready for first AI report",
    description: "Add more events for richer insights (5+ recommended).",
    icon: Zap,
    className: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    dotColor: "text-sky-400",
  },
  strong: {
    label: "Strong evidence base",
    description: "Well-tagged game — AI report will have strong evidence.",
    icon: TrendingUp,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dotColor: "text-emerald-400",
  },
};

function computeReadiness(
  hasVideo: boolean,
  timestampCount: number
): ReadinessLevel {
  if (!hasVideo && timestampCount === 0) return "not_ready";
  if (hasVideo && timestampCount === 0) return "needs_context";
  if (timestampCount >= 5) return "strong";
  return "ready";
}

interface AIReadinessBadgeProps {
  hasVideo: boolean;
  timestampCount: number;
  rosterCount?: number;
  compact?: boolean;
  className?: string;
}

export function AIReadinessBadge({
  hasVideo,
  timestampCount,
  compact = false,
  className,
}: AIReadinessBadgeProps) {
  const level = computeReadiness(hasVideo, timestampCount);
  const config = CONFIGS[level];
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          config.className,
          className
        )}
      >
        <span className={cn("text-[8px]", config.dotColor)} aria-hidden>●</span>
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        config.className,
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{config.label}</p>
        <p className="text-xs opacity-80 mt-0.5">{config.description}</p>
        {level === "ready" && (
          <p className="text-xs opacity-60 mt-1">
            {timestampCount} event{timestampCount !== 1 ? "s" : ""} tagged — 5+ recommended for best results.
          </p>
        )}
        {level === "strong" && (
          <p className="text-xs opacity-60 mt-1">
            {timestampCount} events tagged.
          </p>
        )}
      </div>
    </div>
  );
}
