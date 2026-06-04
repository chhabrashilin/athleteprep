import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { CricketStatusBadge } from "./CricketStatusBadge";
import type { CricketModuleStatus } from "./CricketStatusBadge";

interface CricketModuleCardProps {
  name: string;
  description: string;
  status: CricketModuleStatus;
  href?: string;
  className?: string;
}

export function CricketModuleCard({
  name,
  description,
  status,
  href,
  className,
}: CricketModuleCardProps) {
  const isDisabled = status === "coming_soon";
  const isLinked = !!href && !isDisabled;

  const content = (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-slate-900 p-5 transition-all",
        isLinked
          ? "border-slate-800 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer"
          : "border-slate-800/60 opacity-70",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100 leading-tight">{name}</h3>
        <CricketStatusBadge status={status} />
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      {isLinked && (
        <span className="text-xs font-medium text-sky-500">Open →</span>
      )}
    </div>
  );

  if (isLinked) {
    return (
      <Link
        href={href}
        aria-label={`Open ${name} module`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return (
    <div aria-label={`${name} — ${status === "coming_soon" ? "coming soon" : "foundation ready"}`}>
      {content}
    </div>
  );
}
