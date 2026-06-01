"use client";

import { useState, useMemo } from "react";
import { PlayerCard } from "./PlayerCard";
import { PlayerEmptyState } from "./PlayerEmptyState";
import type { Player } from "@/types/database";

interface RosterListProps {
  players: Player[];
  positions: string[];
  canEdit: boolean;
  teamId: string;
}

const STATUS_FILTER_OPTIONS = [
  { value: "all",      label: "All statuses" },
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "injured",  label: "Injured" },
  { value: "graduated",label: "Graduated" },
  { value: "archived", label: "Archived" },
];

export function RosterList({ players, positions, canEdit, teamId }: RosterListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = players;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName?.toLowerCase().includes(q) ||
          p.displayName?.toLowerCase().includes(q) ||
          p.jerseyNumber?.includes(q) ||
          p.position?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (positionFilter !== "all") {
      result = result.filter((p) => p.position === positionFilter);
    }

    return result;
  }, [players, search, statusFilter, positionFilter]);

  const hasFilters = search || statusFilter !== "all" || positionFilter !== "all";

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {positions.length > 0 && (
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="all">All positions</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPositionFilter("all");
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        hasFilters ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-400">
              No players match your filters
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPositionFilter("all");
              }}
              className="mt-2 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <PlayerEmptyState teamId={teamId} canEdit={canEdit} />
        )
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 mb-1">
            {filtered.length} {filtered.length === 1 ? "player" : "players"}
            {hasFilters ? " matching filters" : ""}
          </p>
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              teamId={teamId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
