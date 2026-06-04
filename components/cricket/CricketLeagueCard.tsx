import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CricketLeague } from "@/lib/cricket/types";

interface CricketLeagueCardProps {
  league: CricketLeague;
  href?: string;
  className?: string;
}

export function CricketLeagueCard({ league, href, className }: CricketLeagueCardProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5",
        href && "transition-all hover:border-emerald-500/40 hover:bg-slate-800/60",
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-100 leading-tight mb-0.5">
          {league.name}
        </h3>
        {league.seasonName && (
          <p className="text-xs text-slate-500">{league.seasonName}</p>
        )}
      </div>

      {league.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {league.description}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {(league.city || league.country) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {[league.city, league.country].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {league.oversPerInnings}-over {league.format.replace("_", " ")}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`View ${league.name}`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
