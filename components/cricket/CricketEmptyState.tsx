import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface CricketEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function CricketEmptyState({
  icon,
  title,
  description,
  backHref,
  backLabel,
  action,
  className,
}: CricketEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700",
        "bg-slate-900/40 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">{description}</p>
      {(action || backHref) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {backHref && (
            <Link
              href={backHref}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← {backLabel ?? "Go back"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
