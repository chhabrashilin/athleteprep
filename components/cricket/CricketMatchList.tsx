import { Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CricketMatch } from "@/lib/cricket/types";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  live: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  innings_break: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  completed: "text-slate-400 bg-slate-800/60 border-slate-700/50",
  abandoned: "text-red-400 bg-red-500/10 border-red-500/20",
  cancelled: "text-slate-500 bg-slate-800/40 border-slate-700/30",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  live: "Live",
  innings_break: "Innings Break",
  completed: "Completed",
  abandoned: "Abandoned",
  cancelled: "Cancelled",
};

interface MatchTeamNames {
  homeTeamName?: string;
  awayTeamName?: string;
  venueName?: string;
}

interface CricketMatchListProps {
  matches: CricketMatch[];
  teamNames?: Record<string, MatchTeamNames>;
  emptyMessage?: string;
  className?: string;
}

export function CricketMatchList({
  matches,
  teamNames = {},
  emptyMessage = "No matches scheduled.",
  className,
}: CricketMatchListProps) {
  if (matches.length === 0) {
    return (
      <p className={cn("text-sm text-slate-500 py-4 text-center", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-slate-800/60", className)} aria-label="Matches">
      {matches.map((match) => {
        const names = teamNames[match.id] ?? {};
        const statusStyle = STATUS_STYLES[match.matchStatus] ?? STATUS_STYLES.scheduled;
        const statusLabel = STATUS_LABELS[match.matchStatus] ?? match.matchStatus;

        return (
          <li key={match.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {names.homeTeamName ?? "TBD"}{" "}
                <span className="text-slate-500">vs</span>{" "}
                {names.awayTeamName ?? "TBD"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                {match.scheduledStart && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {new Date(match.scheduledStart).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                {names.venueName && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {names.venueName}
                  </span>
                )}
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                statusStyle
              )}
            >
              {statusLabel}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
