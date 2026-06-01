import { Badge } from "@/components/ui/Badge";
import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { SPORT_LABELS } from "@/types/sports";
import type { Team, TeamMember } from "@/types/database";

const SPORT_BADGE_COLORS: Record<string, string> = {
  soccer:            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cricket:           "bg-sky-500/15 text-sky-400 border-sky-500/30",
  basketball:        "bg-orange-500/15 text-orange-400 border-orange-500/30",
  american_football: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  hockey:            "bg-blue-500/15 text-blue-400 border-blue-500/30",
  volleyball:        "bg-purple-500/15 text-purple-400 border-purple-500/30",
  other:             "bg-slate-700/60 text-slate-400 border-slate-600",
};

const ROLE_LABELS: Record<string, string> = {
  owner:   "Owner",
  coach:   "Coach",
  analyst: "Analyst",
  player:  "Player",
  viewer:  "Viewer",
};

interface TeamOverviewHeaderProps {
  team: Team;
  membership: TeamMember;
}

export function TeamOverviewHeader({ team, membership }: TeamOverviewHeaderProps) {
  const sportLabel = SPORT_LABELS[team.sport] ?? team.sport;
  const sportBadgeClass =
    SPORT_BADGE_COLORS[team.sport] ?? SPORT_BADGE_COLORS.other;
  const roleLabel = ROLE_LABELS[membership.role] ?? membership.role;

  return (
    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">
              {team.name}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${sportBadgeClass}`}
            >
              {sportLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {team.organizationName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                {team.organizationName}
                {team.level ? ` — ${team.level}` : ""}
              </span>
            )}
            {team.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {team.location}
              </span>
            )}
          </div>

          {team.description && (
            <p className="mt-3 text-sm text-slate-400 max-w-prose">
              {team.description}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <Badge variant="default" className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-sky-400" />
            <span className="text-sky-400">{roleLabel}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
}
