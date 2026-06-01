"use client";

import { Clock } from "lucide-react";
import { EventTimestampCard } from "@/components/timestamps/EventTimestampCard";
import type { EventTimestamp, Player } from "@/types/database";

interface EventTimestampListProps {
  events: EventTimestamp[];
  players: Player[];
  selectedEventId: string | null;
  canEdit: boolean;
  deletingId: string | null;
  onSeek: (seconds: number) => void;
  onEdit: (event: EventTimestamp) => void;
  onDelete: (event: EventTimestamp) => void;
}

export function EventTimestampList({
  events,
  players,
  selectedEventId,
  canEdit,
  deletingId,
  onSeek,
  onEdit,
  onDelete,
}: EventTimestampListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
        <Clock className="h-7 w-7 text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-400">No events match your filters</p>
        <p className="text-xs text-slate-500 mt-1">Try adjusting the search or filters above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <EventTimestampCard
          key={event.id}
          event={event}
          players={players}
          isSelected={selectedEventId === event.id}
          canEdit={canEdit}
          onSeek={(seconds) => onSeek(seconds)}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deletingId === event.id}
        />
      ))}
    </div>
  );
}
