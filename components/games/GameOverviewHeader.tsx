import Link from "next/link";
import { GameStatusBadge } from "./GameStatusBadge";
import { GameTypeBadge } from "./GameTypeBadge";
import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, Swords, Trophy, Pencil } from "lucide-react";
import { HOME_AWAY_LABELS } from "@/types/sports";
import type { Game } from "@/types/database";
import type { HomeAwayStatus } from "@/types/sports";

interface GameOverviewHeaderProps {
  game: Game;
  teamId: string;
  canEdit: boolean;
}

export function GameOverviewHeader({ game, teamId, canEdit }: GameOverviewHeaderProps) {
  const dateLabel = game.gameDate
    ? new Date(game.gameDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const scoreLabel =
    game.teamScore || game.opponentScore
      ? `${game.teamScore ?? "—"} – ${game.opponentScore ?? "—"}`
      : null;

  const homeAwayLabel =
    game.homeAway && game.homeAway !== "not_applicable"
      ? HOME_AWAY_LABELS[game.homeAway as HomeAwayStatus]
      : null;

  return (
    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <GameTypeBadge gameType={game.gameType} />
            <GameStatusBadge status={game.status} />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-100 mb-3">
            {game.title}
          </h2>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-400">
            {game.opponentName && (
              <span className="flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-slate-500" />
                vs. {game.opponentName}
                {homeAwayLabel && (
                  <span className="text-slate-500">({homeAwayLabel})</span>
                )}
              </span>
            )}
            {dateLabel && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {dateLabel}
              </span>
            )}
            {game.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {game.venue}
              </span>
            )}
            {scoreLabel && (
              <span className="flex items-center gap-1.5 font-mono font-semibold text-slate-200">
                <Trophy className="h-3.5 w-3.5 text-slate-500" />
                {scoreLabel}
                {game.result && (
                  <span className="font-sans font-medium text-slate-400">
                    ({game.result})
                  </span>
                )}
              </span>
            )}
            {game.competitionName && (
              <span className="text-slate-500">{game.competitionName}</span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="shrink-0">
            <Link href={`/teams/${teamId}/games/${game.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </Button>
            </Link>
          </div>
        )}
      </div>

      {game.coachNotes && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs font-medium text-slate-500 mb-1">Coach notes</p>
          <p className="text-sm text-slate-400 whitespace-pre-wrap line-clamp-3">
            {game.coachNotes}
          </p>
        </div>
      )}
    </div>
  );
}
