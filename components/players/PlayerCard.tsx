import Link from "next/link";
import { PlayerStatusBadge } from "./PlayerStatusBadge";
import { Button } from "@/components/ui/Button";
import { Pencil } from "lucide-react";
import type { Player } from "@/types/database";

interface PlayerCardProps {
  player: Player;
  teamId: string;
  canEdit: boolean;
}

export function PlayerCard({ player, teamId, canEdit }: PlayerCardProps) {
  const displayName =
    player.displayName ||
    [player.firstName, player.lastName].filter(Boolean).join(" ");

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 hover:border-slate-700 transition-colors">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
        <span className="text-sm font-semibold text-slate-300">{initials}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-100 truncate">
            {displayName}
          </p>
          {player.jerseyNumber && (
            <span className="text-xs text-slate-500 font-mono shrink-0">
              #{player.jerseyNumber}
            </span>
          )}
          <PlayerStatusBadge status={player.status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {player.position && (
            <span className="text-xs text-slate-400">{player.position}</span>
          )}
          {player.role && (
            <span className="text-xs text-slate-500">{player.role}</span>
          )}
          {!player.position && !player.role && (
            <span className="text-xs text-slate-600 italic">No position set</span>
          )}
        </div>
        {player.notes && (
          <p className="text-xs text-slate-600 mt-1 truncate">{player.notes}</p>
        )}
      </div>

      {/* Edit action */}
      {canEdit && (
        <Link
          href={`/teams/${teamId}/players/${player.id}/edit`}
          className="shrink-0"
        >
          <Button variant="ghost" size="sm" aria-label={`Edit ${displayName}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
