"use client";

import { Clock, Tag, Users, Edit2, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EventImportanceBadge } from "@/components/timestamps/EventImportanceBadge";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import type { EventTimestamp } from "@/types/database";
import type { Player } from "@/types/database";
import { TEAM_CONTEXT_LABELS } from "@/types/sports";
import type { TeamContext } from "@/types/sports";

interface EventTimestampCardProps {
  event: EventTimestamp;
  players: Player[];
  isSelected: boolean;
  canEdit: boolean;
  onSeek: (seconds: number) => void;
  onEdit: (event: EventTimestamp) => void;
  onDelete: (event: EventTimestamp) => void;
  isDeleting: boolean;
}

export function EventTimestampCard({
  event,
  players,
  isSelected,
  canEdit,
  onSeek,
  onEdit,
  onDelete,
  isDeleting,
}: EventTimestampCardProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const taggedPlayers = event.playerIds
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => p != null);

  const teamContextLabel =
    event.teamContext && event.teamContext in TEAM_CONTEXT_LABELS
      ? TEAM_CONTEXT_LABELS[event.teamContext as TeamContext]
      : event.teamContext;

  return (
    <div
      className={cn(
        "rounded-xl border bg-slate-900 transition-all",
        isSelected
          ? "border-sky-500/50 ring-1 ring-sky-500/30"
          : "border-slate-800 hover:border-slate-700"
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => onSeek(event.timestampSeconds)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSeek(event.timestampSeconds);
        }}
        aria-label={`Jump to ${formatSecondsAsTimestamp(event.timestampSeconds)} — ${event.label}`}
      >
        {/* Timestamp pill */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-mono font-semibold text-sky-400">
          <Clock className="h-3 w-3" />
          {formatSecondsAsTimestamp(event.timestampSeconds)}
          {event.endTimestampSeconds != null && (
            <span className="text-slate-500">
              → {formatSecondsAsTimestamp(event.endTimestampSeconds)}
            </span>
          )}
        </div>

        {/* Label + type */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">{event.label}</p>
          {event.eventType && (
            <p className="text-xs text-slate-500 truncate">{event.eventType}</p>
          )}
        </div>

        {/* Importance + seek affordance */}
        <div className="flex shrink-0 items-center gap-2">
          <EventImportanceBadge importance={event.importance} />
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        </div>
      </div>

      {/* Body — context details */}
      {(event.description || teamContextLabel || taggedPlayers.length > 0 || event.tags.length > 0) && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-2">
          {event.description && (
            <p className="text-xs text-slate-400 line-clamp-2">{event.description}</p>
          )}

          {(teamContextLabel || taggedPlayers.length > 0 || event.opponentPlayerNames.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {teamContextLabel && (
                <span className="text-xs text-slate-500">
                  Context: <span className="text-slate-400">{teamContextLabel}</span>
                </span>
              )}
              {taggedPlayers.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="h-3 w-3" />
                  {taggedPlayers.map((p) => p.displayName ?? p.firstName).join(", ")}
                </span>
              )}
              {event.opponentPlayerNames.length > 0 && (
                <span className="text-xs text-slate-500">
                  Opp: {event.opponentPlayerNames.join(", ")}
                </span>
              )}
            </div>
          )}

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Tag className="h-3 w-3 text-slate-600 mt-0.5 shrink-0" />
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-slate-400 hover:text-slate-100"
            onClick={() => onEdit(event)}
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => onDelete(event)}
            loading={isDeleting}
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
