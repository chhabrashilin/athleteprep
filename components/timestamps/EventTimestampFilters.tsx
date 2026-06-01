"use client";

import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { Player } from "@/types/database";
import type { EventImportance, TeamContext } from "@/types/sports";
import { TEAM_CONTEXT_LABELS } from "@/types/sports";

export interface TimestampFilters {
  search: string;
  importance: EventImportance | "";
  teamContext: TeamContext | "";
  eventType: string;
  playerId: string;
}

interface EventTimestampFiltersProps {
  filters: TimestampFilters;
  onChange: (filters: TimestampFilters) => void;
  availableEventTypes: string[];
  players: Player[];
  totalCount: number;
  filteredCount: number;
}

export function EventTimestampFilters({
  filters,
  onChange,
  availableEventTypes,
  players,
  totalCount,
  filteredCount,
}: EventTimestampFiltersProps) {
  const hasActiveFilters =
    filters.search || filters.importance || filters.teamContext || filters.eventType || filters.playerId;

  function update(patch: Partial<TimestampFilters>) {
    onChange({ ...filters, ...patch });
  }

  function reset() {
    onChange({ search: "", importance: "", teamContext: "", eventType: "", playerId: "" });
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        <input
          type="search"
          placeholder="Search events…"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800/60 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      {/* Filter row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          options={[
            { value: "", label: "All importance" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          value={filters.importance}
          onChange={(e) => update({ importance: e.target.value as EventImportance | "" })}
          className="h-9 text-xs"
        />
        <Select
          options={[
            { value: "", label: "All contexts" },
            ...Object.entries(TEAM_CONTEXT_LABELS).map(([v, l]) => ({ value: v, label: l })),
          ]}
          value={filters.teamContext}
          onChange={(e) => update({ teamContext: e.target.value as TeamContext | "" })}
          className="h-9 text-xs"
        />
        {availableEventTypes.length > 0 && (
          <Select
            options={[
              { value: "", label: "All types" },
              ...availableEventTypes.map((t) => ({ value: t, label: t })),
            ]}
            value={filters.eventType}
            onChange={(e) => update({ eventType: e.target.value })}
            className="h-9 text-xs"
          />
        )}
        {players.length > 0 && (
          <Select
            options={[
              { value: "", label: "All players" },
              ...players.map((p) => ({
                value: p.id,
                label: p.displayName ?? p.firstName,
              })),
            ]}
            value={filters.playerId}
            onChange={(e) => update({ playerId: e.target.value })}
            className="h-9 text-xs"
          />
        )}
      </div>

      {/* Active filter summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {filteredCount === totalCount
            ? `${totalCount} event${totalCount !== 1 ? "s" : ""}`
            : `${filteredCount} of ${totalCount} events`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
