"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { formatSecondsAsTimestamp, parseTimestampToSeconds } from "@/lib/utils/time";
import { createEventTimestampAction, updateEventTimestampAction } from "@/lib/actions/timestamps";
import type { EventTimestamp, Player } from "@/types/database";
import type { EventImportance, SportType, TeamContext } from "@/types/sports";
import { TEAM_CONTEXT_LABELS, getEventTypesForSport } from "@/types/sports";

interface EventTimestampFormProps {
  teamId: string;
  gameId: string;
  videoAssetId: string | null;
  sport: SportType;
  players: Player[];
  editingEvent: EventTimestamp | null;
  prefillSeconds: number | null;
  videoDurationSeconds: number | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormErrors {
  timestamp?: string;
  endTimestamp?: string;
  label?: string;
  description?: string;
  tags?: string;
  general?: string;
}

function deriveInitialState(
  editingEvent: EventTimestamp | null,
  prefillSeconds: number | null,
  suggestedEventTypes: string[]
) {
  if (editingEvent) {
    const isKnownType = suggestedEventTypes.includes(editingEvent.eventType ?? "");
    return {
      timestampInput: formatSecondsAsTimestamp(editingEvent.timestampSeconds),
      endTimestampInput: editingEvent.endTimestampSeconds != null
        ? formatSecondsAsTimestamp(editingEvent.endTimestampSeconds)
        : "",
      label: editingEvent.label,
      eventType: isKnownType ? (editingEvent.eventType ?? "") : "__custom__",
      customEventType: !isKnownType ? (editingEvent.eventType ?? "") : "",
      teamContext: (editingEvent.teamContext ?? "") as TeamContext | "",
      description: editingEvent.description ?? "",
      importance: editingEvent.importance as EventImportance,
      tags: editingEvent.tags,
      selectedPlayerIds: editingEvent.playerIds,
      opponentNames: editingEvent.opponentPlayerNames.join(", "),
    };
  }
  return {
    timestampInput: prefillSeconds != null ? formatSecondsAsTimestamp(prefillSeconds) : "",
    endTimestampInput: "",
    label: "",
    eventType: "",
    customEventType: "",
    teamContext: "" as TeamContext | "",
    description: "",
    importance: "medium" as EventImportance,
    tags: [] as string[],
    selectedPlayerIds: [] as string[],
    opponentNames: "",
  };
}

export function EventTimestampForm({
  teamId,
  gameId,
  videoAssetId,
  sport,
  players,
  editingEvent,
  prefillSeconds,
  videoDurationSeconds,
  onClose,
  onSaved,
}: EventTimestampFormProps) {
  const router = useRouter();
  const isEditing = editingEvent != null;
  const suggestedEventTypes = getEventTypesForSport(sport);
  const initial = deriveInitialState(editingEvent, prefillSeconds, suggestedEventTypes);

  const [timestampInput, setTimestampInput] = useState(initial.timestampInput);
  const [endTimestampInput, setEndTimestampInput] = useState(initial.endTimestampInput);
  const [label, setLabel] = useState(initial.label);
  const [eventType, setEventType] = useState(initial.eventType);
  const [customEventType, setCustomEventType] = useState(initial.customEventType);
  const [teamContext, setTeamContext] = useState<TeamContext | "">(initial.teamContext);
  const [description, setDescription] = useState(initial.description);
  const [importance, setImportance] = useState<EventImportance>(initial.importance);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(initial.selectedPlayerIds);
  const [opponentNames, setOpponentNames] = useState(initial.opponentNames);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const labelRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    const ts = parseTimestampToSeconds(timestampInput);
    if (ts === null) {
      newErrors.timestamp = "Enter a valid time — e.g. 1:23 or 83";
    } else if (videoDurationSeconds != null && ts > videoDurationSeconds) {
      newErrors.timestamp = `Timestamp exceeds video duration (${formatSecondsAsTimestamp(videoDurationSeconds)})`;
    }

    if (endTimestampInput.trim()) {
      const endTs = parseTimestampToSeconds(endTimestampInput);
      if (endTs === null) {
        newErrors.endTimestamp = "Enter a valid end time or leave blank";
      } else if (ts !== null && endTs <= ts) {
        newErrors.endTimestamp = "End time must be after start time";
      }
    }

    if (!label.trim()) {
      newErrors.label = "Label is required";
    } else if (label.trim().length < 2) {
      newErrors.label = "Label must be at least 2 characters";
    } else if (label.trim().length > 120) {
      newErrors.label = "Label must be 120 characters or less";
    }

    if (description.length > 1500) {
      newErrors.description = "Description must be 1500 characters or less";
    }

    if (tags.length > 20) {
      newErrors.tags = "Maximum 20 tags";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (isSaving) return;

    const ts = parseTimestampToSeconds(timestampInput)!;
    const endTs = endTimestampInput.trim()
      ? parseTimestampToSeconds(endTimestampInput)
      : null;

    const resolvedEventType =
      eventType === "__custom__"
        ? customEventType.trim() || null
        : eventType || null;

    const parsedOpponentNames = opponentNames
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    setIsSaving(true);

    try {
      let result: { error?: string };

      if (isEditing) {
        result = await updateEventTimestampAction({
          teamId,
          gameId,
          eventId: editingEvent!.id,
          timestampSeconds: ts,
          endTimestampSeconds: endTs ?? undefined,
          label: label.trim(),
          eventType: resolvedEventType,
          teamContext: teamContext || null,
          description: description.trim() || null,
          importance,
          tags,
          playerIds: selectedPlayerIds,
          opponentPlayerNames: parsedOpponentNames,
        });
      } else {
        result = await createEventTimestampAction({
          teamId,
          gameId,
          videoAssetId,
          timestampSeconds: ts,
          endTimestampSeconds: endTs ?? undefined,
          label: label.trim(),
          eventType: resolvedEventType,
          teamContext: teamContext || null,
          description: description.trim() || null,
          importance,
          tags,
          playerIds: selectedPlayerIds,
          opponentPlayerNames: parsedOpponentNames,
        });
      }

      if (result.error) {
        setErrors({ general: result.error });
      } else {
        router.refresh();
        onSaved();
      }
    } finally {
      setIsSaving(false);
    }
  }

  function addTag() {
    const normalized = tagInput.trim().toLowerCase();
    if (!normalized || tags.includes(normalized) || tags.length >= 20) return;
    setTags([...tags, normalized]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          {isEditing ? "Edit event" : "Add key moment"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {errors.general && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errors.general}
        </div>
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Timestamp *"
          placeholder="1:23 or 83"
          value={timestampInput}
          onChange={(e) => setTimestampInput(e.target.value)}
          error={errors.timestamp}
          hint="MM:SS, H:MM:SS, or seconds"
          autoComplete="off"
        />
        <Input
          label="End timestamp"
          placeholder="1:45 (optional)"
          value={endTimestampInput}
          onChange={(e) => setEndTimestampInput(e.target.value)}
          error={errors.endTimestamp}
          hint="Leave blank for single moment"
          autoComplete="off"
        />
      </div>

      {/* Label */}
      <Input
        ref={labelRef}
        label="Label *"
        placeholder="e.g. Defensive breakdown at left wing"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        error={errors.label}
        maxLength={120}
      />

      {/* Importance */}
      <Select
        label="Importance *"
        value={importance}
        onChange={(e) => setImportance(e.target.value as EventImportance)}
        options={[
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "critical", label: "Critical" },
        ]}
      />

      {/* Event type */}
      <div className="space-y-2">
        <Select
          label="Event type"
          value={eventType}
          onChange={(e) => {
            setEventType(e.target.value);
            if (e.target.value !== "__custom__") setCustomEventType("");
          }}
          options={[
            { value: "", label: "Select a type…" },
            ...suggestedEventTypes.map((t) => ({ value: t, label: t })),
            { value: "__custom__", label: "Custom type…" },
          ]}
        />
        {eventType === "__custom__" && (
          <Input
            placeholder="Describe the event type"
            value={customEventType}
            onChange={(e) => setCustomEventType(e.target.value)}
            maxLength={80}
          />
        )}
      </div>

      {/* Team context */}
      <Select
        label="Team context"
        value={teamContext}
        onChange={(e) => setTeamContext(e.target.value as TeamContext | "")}
        options={[
          { value: "", label: "Select context…" },
          ...Object.entries(TEAM_CONTEXT_LABELS).map(([v, l]) => ({ value: v, label: l })),
        ]}
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="What happened and why does it matter?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        hint={`${description.length}/1500`}
        className="min-h-16"
      />

      {/* Related players */}
      {players.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">Related players</p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => {
              const isSelected = selectedPlayerIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlayer(p.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  {p.jerseyNumber ? `#${p.jerseyNumber} ` : ""}
                  {p.displayName ?? p.firstName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Opponent player names */}
      <Input
        label="Opponent players"
        placeholder="e.g. Johnson, Torres (comma-separated)"
        value={opponentNames}
        onChange={(e) => setOpponentNames(e.target.value)}
        hint="Names of opponent players involved"
      />

      {/* Tags */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">Tags</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.tags && <p className="text-xs text-red-400">{errors.tags}</p>}
        {tags.length < 20 && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" size="sm" loading={isSaving} disabled={isSaving}>
          {isEditing ? "Save changes" : "Add event"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
