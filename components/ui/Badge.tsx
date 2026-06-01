import { cn } from "@/lib/utils/cn";
import type { ConfidenceLevel, VerificationStatus } from "@/types/core";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "brand"
  | "confidence-high"
  | "confidence-medium"
  | "confidence-low"
  | "verification-accurate"
  | "verification-partially_accurate"
  | "verification-inaccurate"
  | "verification-edited"
  | "verification-unreviewed";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-800 text-slate-300 border-slate-700",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  muted: "bg-slate-800/60 text-slate-500 border-slate-700/50",
  brand: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "confidence-high": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "confidence-medium": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "confidence-low": "bg-slate-700/60 text-slate-400 border-slate-600",
  "verification-accurate": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "verification-partially_accurate": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "verification-inaccurate": "bg-red-500/15 text-red-400 border-red-500/30",
  "verification-edited": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "verification-unreviewed": "bg-slate-800/60 text-slate-500 border-slate-700/50",
};

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function ConfidenceBadge({ level, className }: { level: ConfidenceLevel; className?: string }) {
  const labels: Record<ConfidenceLevel, string> = {
    high: "High Confidence",
    medium: "Medium Confidence",
    low: "Low Confidence",
  };
  const dots: Record<ConfidenceLevel, string> = {
    high: "text-emerald-400",
    medium: "text-amber-400",
    low: "text-slate-400",
  };
  return (
    <Badge variant={`confidence-${level}`} className={className}>
      <span className={cn("text-[10px]", dots[level])} aria-hidden="true">●</span>
      {labels[level]}
    </Badge>
  );
}

function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const labels: Record<VerificationStatus, string> = {
    unreviewed: "Unreviewed",
    accurate: "Accurate",
    partially_accurate: "Partially Accurate",
    inaccurate: "Inaccurate",
    edited: "Edited",
  };
  return (
    <Badge variant={`verification-${status}`} className={className}>
      {labels[status]}
    </Badge>
  );
}

export { Badge, ConfidenceBadge, VerificationBadge };
export type { BadgeProps, BadgeVariant };
