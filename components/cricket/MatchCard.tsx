import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import type { CricketMatchFull } from "@/lib/cricket/types";

interface MatchCardProps {
  match: CricketMatchFull;
  homeTeamName?: string;
  awayTeamName?: string;
  venueName?: string;
  leagueSlug?: string;
  showActions?: boolean;
  canManage?: boolean;
}

function formatMatchDate(iso: string | null): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScheduleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    unscheduled: { label: "Unscheduled", cls: "bg-slate-700 text-slate-400" },
    scheduled: { label: "Scheduled", cls: "bg-sky-500/10 text-sky-400" },
    rescheduled: { label: "Rescheduled", cls: "bg-amber-500/10 text-amber-400" },
    postponed: { label: "Postponed", cls: "bg-orange-500/10 text-orange-400" },
    cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-400" },
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-700 text-slate-400" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function PublishStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        Published
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-400">
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-500">
      {status}
    </span>
  );
}

export function MatchCard({
  match,
  homeTeamName,
  awayTeamName,
  venueName,
  leagueSlug,
  showActions = false,
  canManage = false,
}: MatchCardProps) {
  const href = `/cricket/matches/${match.slug ?? match.id}`;
  const editHref = `/cricket/matches/${match.slug ?? match.id}/edit`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {match.matchNumber && (
            <p className="text-xs text-slate-500 mb-1">Match #{match.matchNumber}</p>
          )}
          <Link href={href} className="block">
            <p className="text-sm font-semibold text-slate-100 hover:text-sky-400 transition-colors">
              {match.title ?? `${homeTeamName ?? "Home"} vs ${awayTeamName ?? "Away"}`}
            </p>
          </Link>
          {!match.title && (
            <p className="text-xs text-slate-400 mt-0.5">
              {homeTeamName ?? "TBD"} <span className="text-slate-600">vs</span> {awayTeamName ?? "TBD"}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ScheduleStatusBadge status={match.scheduleStatus} />
          <PublishStatusBadge status={match.publishStatus} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {match.scheduledStart && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400">{formatMatchDate(match.scheduledStart)}</span>
          </div>
        )}
        {venueName && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400">{venueName}</span>
          </div>
        )}
      </div>

      {(match.roundName || match.stage) && (
        <div className="flex flex-wrap gap-1.5">
          {match.roundName && (
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {match.roundName}
            </span>
          )}
          {match.stage && (
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 capitalize">
              {match.stage.replace("_", " ")}
            </span>
          )}
        </div>
      )}

      {showActions && canManage && (
        <div className="mt-auto pt-2 border-t border-slate-800 flex items-center gap-3">
          <Link href={editHref} className="text-xs text-sky-500 hover:text-sky-400 transition-colors">
            Edit
          </Link>
          {leagueSlug && (
            <Link
              href={`/cricket/leagues/${leagueSlug}/schedule`}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Schedule
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export { ScheduleStatusBadge, PublishStatusBadge, formatMatchDate };
