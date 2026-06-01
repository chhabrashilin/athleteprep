import Link from "next/link";
import { GameStatusBadge } from "./GameStatusBadge";
import { GameTypeBadge } from "./GameTypeBadge";
import { Button } from "@/components/ui/Button";
import { Calendar, MapPin, ArrowRight, Swords, Film } from "lucide-react";
import type { Game } from "@/types/database";

interface GameCardProps {
  game: Game;
  teamId: string;
  hasVideo?: boolean;
}

export function GameCard({ game, teamId, hasVideo = false }: GameCardProps) {
  const dateLabel = game.gameDate
    ? new Date(game.gameDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const scoreLabel =
    game.teamScore || game.opponentScore
      ? `${game.teamScore ?? "—"} – ${game.opponentScore ?? "—"}`
      : null;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 hover:border-slate-700 transition-colors">
      {/* Left: type color bar */}
      <div className="flex flex-col items-start gap-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <GameTypeBadge gameType={game.gameType} />
          <GameStatusBadge status={game.status} />
          {game.result && (
            <span className="text-xs font-medium text-slate-400">{game.result}</span>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-100 leading-snug">
          {game.title}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {hasVideo && (
            <span className="flex items-center gap-1 text-emerald-500/70">
              <Film className="h-3 w-3" />
              Video
            </span>
          )}
          {game.opponentName && (
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3" />
              vs. {game.opponentName}
            </span>
          )}
          {dateLabel && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateLabel}
            </span>
          )}
          {game.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {game.venue}
            </span>
          )}
          {scoreLabel && (
            <span className="font-mono">{scoreLabel}</span>
          )}
        </div>
      </div>

      {/* Right: action */}
      <Link href={`/teams/${teamId}/games/${game.id}`} className="shrink-0 mt-0.5">
        <Button variant="ghost" size="sm" aria-label={`Open ${game.title}`}>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
