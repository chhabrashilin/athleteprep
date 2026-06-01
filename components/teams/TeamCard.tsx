import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Calendar, MapPin, Building2 } from "lucide-react";
import { SPORT_LABELS } from "@/types/sports";
import type { Team, TeamMember } from "@/types/database";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  coach: "Coach",
  analyst: "Analyst",
  player: "Player",
  viewer: "Viewer",
};

const SPORT_BADGE_COLORS: Record<string, string> = {
  soccer:            "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cricket:           "bg-sky-500/15 text-sky-400 border-sky-500/30",
  basketball:        "bg-orange-500/15 text-orange-400 border-orange-500/30",
  american_football: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  hockey:            "bg-blue-500/15 text-blue-400 border-blue-500/30",
  volleyball:        "bg-purple-500/15 text-purple-400 border-purple-500/30",
  other:             "bg-slate-700/60 text-slate-400 border-slate-600",
};

interface TeamCardProps {
  team: Team;
  membership: TeamMember;
  playerCount?: { total: number; active: number };
  gameCount?: { total: number; draft: number };
}

export function TeamCard({ team, membership, playerCount, gameCount }: TeamCardProps) {
  const sportLabel = SPORT_LABELS[team.sport] ?? team.sport;
  const sportBadgeClass =
    SPORT_BADGE_COLORS[team.sport] ?? SPORT_BADGE_COLORS.other;
  const roleLabel = ROLE_LABELS[membership.role] ?? membership.role;
  const createdDate = new Date(team.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col transition-colors hover:border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold text-slate-100 leading-snug">
            {team.name}
          </CardTitle>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sportBadgeClass}`}
          >
            {sportLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="muted" className="text-xs">
            {roleLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 flex-1 pt-2">
        {team.organizationName && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 className="h-3 w-3 shrink-0 text-slate-500" />
            {team.organizationName}
            {team.level ? ` · ${team.level}` : ""}
          </p>
        )}

        {team.location && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
            {team.location}
          </p>
        )}

        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="h-3 w-3 shrink-0" />
          Created {createdDate}
        </p>

        {team.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
            {team.description}
          </p>
        )}

        {playerCount !== undefined && (
          <p className="text-xs text-slate-500 mt-1">
            {playerCount.total === 0
              ? "No players yet"
              : `${playerCount.active} active · ${playerCount.total} player${playerCount.total !== 1 ? "s" : ""}`}
          </p>
        )}

        {gameCount !== undefined && (
          <p className="text-xs text-slate-500 mt-0.5">
            {gameCount.total === 0
              ? "No analyses yet"
              : `${gameCount.total} game${gameCount.total !== 1 ? "s" : ""} recorded`}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link href={`/teams/${team.id}`}>
            <Button variant="secondary" size="sm" className="w-full">
              Open workspace
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
