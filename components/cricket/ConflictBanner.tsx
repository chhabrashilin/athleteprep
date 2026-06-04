import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { ScheduleConflict } from "@/lib/cricket/types";

interface ConflictBannerProps {
  conflicts: ScheduleConflict[];
  leagueSlug: string;
}

export function ConflictBanner({ conflicts, leagueSlug }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-400">
            {conflicts.length} schedule {conflicts.length === 1 ? "conflict" : "conflicts"} detected
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Review and resolve conflicts before publishing the schedule.
          </p>
          <Link
            href={`/cricket/leagues/${leagueSlug}/schedule#conflicts`}
            className="mt-2 inline-flex items-center text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            Review conflicts →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ConflictsPanelProps {
  conflicts: ScheduleConflict[];
}

export function ConflictsPanel({ conflicts }: ConflictsPanelProps) {
  if (conflicts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-400 font-medium">No schedule conflicts found.</p>
        <p className="text-xs text-slate-400 mt-1">The schedule looks clean and ready to publish.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="conflicts">
      <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {conflicts.length} {conflicts.length === 1 ? "Conflict" : "Conflicts"}
      </h3>
      <div className="space-y-2">
        {conflicts.map((conflict, i) => (
          <div
            key={i}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-400 capitalize">
                  {conflict.type.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-slate-300 mt-1">{conflict.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-slate-400">Fix:</span> {conflict.suggestion}
                </p>
                {conflict.matchA && (
                  <Link
                    href={`/cricket/matches/${conflict.matchA.slug ?? conflict.matchA.id}/edit`}
                    className="mt-2 inline-flex items-center text-xs text-sky-500 hover:text-sky-400 transition-colors"
                  >
                    Edit match →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
