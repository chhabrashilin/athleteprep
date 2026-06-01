import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value?: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string; direction: "up" | "down" | "neutral" };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-900 p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
          {value !== undefined && (
            <p className="mt-2 text-2xl font-bold text-slate-100">{value}</p>
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-400 truncate">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.direction === "up" && "text-emerald-400",
                trend.direction === "down" && "text-red-400",
                trend.direction === "neutral" && "text-slate-400"
              )}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}{" "}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
