"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Film, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GameVideoPlayer, type GameVideoPlayerHandle } from "@/components/video/GameVideoPlayer";
import { VideoAssetSummary } from "@/components/video/VideoAssetSummary";
import { EventTimestampForm } from "@/components/timestamps/EventTimestampForm";
import { EventTimestampList } from "@/components/timestamps/EventTimestampList";
import { EventTimestampFilters, type TimestampFilters } from "@/components/timestamps/EventTimestampFilters";
import { EventTimestampStats } from "@/components/timestamps/EventTimestampStats";
import { formatSecondsAsTimestamp } from "@/lib/utils/time";
import { deleteEventTimestampAction } from "@/lib/actions/timestamps";
import type { EventTimestamp, VideoAsset, Player } from "@/types/database";
import type { SportType } from "@/types/sports";

interface TimestampWorkspaceProps {
  teamId: string;
  gameId: string;
  sport: SportType;
  signedUrl: string | null;
  videoAsset: VideoAsset | null;
  players: Player[];
  initialEvents: EventTimestamp[];
  canEdit: boolean;
}

function filterEvents(events: EventTimestamp[], filters: TimestampFilters): EventTimestamp[] {
  return events.filter((e) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        e.label,
        e.description ?? "",
        e.eventType ?? "",
        ...e.tags,
      ].join(" ").toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filters.importance && e.importance !== filters.importance) return false;
    if (filters.teamContext && e.teamContext !== filters.teamContext) return false;
    if (filters.eventType && e.eventType !== filters.eventType) return false;
    if (filters.playerId && !e.playerIds.includes(filters.playerId)) return false;
    return true;
  });
}

export function TimestampWorkspace({
  teamId,
  gameId,
  sport,
  signedUrl,
  videoAsset,
  players,
  initialEvents,
  canEdit,
}: TimestampWorkspaceProps) {
  const router = useRouter();
  const videoRef = useRef<GameVideoPlayerHandle>(null);

  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventTimestamp | null>(null);
  const [prefillSeconds, setPrefillSeconds] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TimestampFilters>({
    search: "",
    importance: "",
    teamContext: "",
    eventType: "",
    playerId: "",
  });

  const handleTimeUpdate = useCallback((seconds: number) => {
    setCurrentVideoTime(seconds);
  }, []);

  function openCreateForm() {
    const currentTime = videoRef.current?.getCurrentTime() ?? currentVideoTime;
    setEditingEvent(null);
    setPrefillSeconds(currentTime);
    setFormKey((k) => k + 1);
    setIsFormOpen(true);
  }

  function openEditForm(event: EventTimestamp) {
    setEditingEvent(event);
    setPrefillSeconds(null);
    setFormKey((k) => k + 1);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingEvent(null);
    setPrefillSeconds(null);
  }

  function seekToEvent(seconds: number, eventId?: string) {
    videoRef.current?.seekTo(seconds);
    if (eventId) setSelectedEventId(eventId);
    document.getElementById("video-player-column")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function handleDelete(event: EventTimestamp) {
    if (!window.confirm(`Delete "${event.label}"? This cannot be undone.`)) return;
    setDeletingId(event.id);
    try {
      const result = await deleteEventTimestampAction(teamId, gameId, event.id);
      if (!result.error) {
        if (selectedEventId === event.id) setSelectedEventId(null);
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleFormSaved() {
    closeForm();
  }

  const filteredEvents = filterEvents(initialEvents, filters);
  const availableEventTypes = Array.from(
    new Set(initialEvents.map((e) => e.eventType).filter((t): t is string => !!t))
  );

  const videoDuration = videoAsset?.durationSeconds ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Left column: video ── */}
      <div id="video-player-column" className="space-y-4">
        {signedUrl && videoAsset ? (
          <>
            <GameVideoPlayer
              ref={videoRef}
              signedUrl={signedUrl}
              videoAsset={videoAsset}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Current time + add button */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-slate-500">Current position</p>
                <p className="text-base font-mono font-bold text-sky-400">
                  {formatSecondsAsTimestamp(currentVideoTime)}
                  {videoDuration != null && (
                    <span className="ml-1 text-sm font-normal text-slate-600">
                      / {formatSecondsAsTimestamp(videoDuration)}
                    </span>
                  )}
                </p>
              </div>
              {canEdit && (
                <Button size="sm" onClick={openCreateForm}>
                  <Plus className="h-3.5 w-3.5" />
                  Add event at current time
                </Button>
              )}
            </div>

            <VideoAssetSummary asset={videoAsset} />
          </>
        ) : videoAsset && !signedUrl ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
            <div className="text-center px-6">
              <Film className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400 mb-1">Video unavailable</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Could not generate a playback URL. Check the storage bucket configuration.
              </p>
            </div>
          </div>
        ) : (
          /* No video uploaded */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-8 py-14 text-center">
            <Film className="h-10 w-10 text-slate-600 mb-4" />
            <h3 className="text-base font-semibold text-slate-300 mb-2">No video uploaded yet</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-5">
              Upload game film first so you can pause at key moments and tag them with timestamps.
            </p>
            <Link href={`/teams/${teamId}/games/${gameId}#video-section`}>
              <Button variant="secondary" size="sm">
                Upload video
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            {canEdit && (
              <p className="text-xs text-slate-600 mt-4">
                You can also add events manually with a typed timestamp.
              </p>
            )}
          </div>
        )}

        {/* Manual add when no video */}
        {canEdit && !signedUrl && (
          <div className="text-center">
            <Button variant="secondary" size="sm" onClick={openCreateForm}>
              <Plus className="h-3.5 w-3.5" />
              Add event manually
            </Button>
          </div>
        )}
      </div>

      {/* ── Right column: form + list ── */}
      <div className="space-y-5">
        {/* Event form — keyed so React remounts it on open/edit changes */}
        {isFormOpen ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <EventTimestampForm
              key={formKey}
              teamId={teamId}
              gameId={gameId}
              videoAssetId={videoAsset?.id ?? null}
              sport={sport}
              players={players}
              editingEvent={editingEvent}
              prefillSeconds={prefillSeconds}
              videoDurationSeconds={videoDuration}
              onClose={closeForm}
              onSaved={handleFormSaved}
            />
          </div>
        ) : (
          canEdit && initialEvents.length === 0 ? (
            /* Premium empty state */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
                <Plus className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-300 mb-2">Tag your first key moment</h3>
              <p className="text-sm text-slate-500 max-w-xs mb-5">
                Key moments become the evidence GameIQ uses to generate coaching insights,
                player feedback, and practice recommendations.
              </p>
              {signedUrl ? (
                <Button size="sm" onClick={openCreateForm}>
                  <Plus className="h-3.5 w-3.5" />
                  Add event at current time
                </Button>
              ) : (
                <Button size="sm" onClick={openCreateForm}>
                  <Plus className="h-3.5 w-3.5" />
                  Add event manually
                </Button>
              )}
              <p className="text-xs text-slate-600 mt-3">
                You can also type a timestamp manually in the form.
              </p>
            </div>
          ) : (
            canEdit && (
              <div className="flex justify-end">
                <Button size="sm" onClick={openCreateForm}>
                  <Plus className="h-3.5 w-3.5" />
                  Add key moment
                </Button>
              </div>
            )
          )
        )}

        {/* Stats */}
        {initialEvents.length > 0 && <EventTimestampStats events={initialEvents} />}

        {/* Filters + list */}
        {initialEvents.length > 0 && (
          <>
            <EventTimestampFilters
              filters={filters}
              onChange={setFilters}
              availableEventTypes={availableEventTypes}
              players={players}
              totalCount={initialEvents.length}
              filteredCount={filteredEvents.length}
            />
            <EventTimestampList
              events={filteredEvents}
              players={players}
              selectedEventId={selectedEventId}
              canEdit={canEdit}
              deletingId={deletingId}
              onSeek={(seconds) => {
                const eventAtTime = filteredEvents.find(
                  (e) => e.timestampSeconds === seconds
                );
                seekToEvent(seconds, eventAtTime?.id);
              }}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          </>
        )}

        {!canEdit && (
          <p className="text-xs text-slate-500 text-center">
            Only coaches and analysts can manage key moments.
          </p>
        )}
      </div>
    </div>
  );
}
