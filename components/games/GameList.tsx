"use client";

import { useState, useMemo } from "react";
import { GameCard } from "./GameCard";
import { GameEmptyState } from "./GameEmptyState";
import type { Game } from "@/types/database";

const GAME_TYPE_OPTIONS = [
  { value: "all",          label: "All types" },
  { value: "match",        label: "Match" },
  { value: "practice",     label: "Practice" },
  { value: "scrimmage",    label: "Scrimmage" },
  { value: "film_session", label: "Film Session" },
];

const STATUS_OPTIONS = [
  { value: "all",               label: "All statuses" },
  { value: "draft",             label: "Draft" },
  { value: "ready_for_analysis",label: "Ready" },
  { value: "analysis_running",  label: "Analyzing" },
  { value: "analyzed",          label: "Analyzed" },
  { value: "archived",          label: "Archived" },
];

interface GameListProps {
  games: Game[];
  canEdit: boolean;
  teamId: string;
  videoStatus?: Record<string, boolean>;
}

export function GameList({ games, canEdit, teamId, videoStatus = {} }: GameListProps) {
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = games;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.opponentName?.toLowerCase().includes(q) ||
          g.venue?.toLowerCase().includes(q) ||
          g.competitionName?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((g) => g.gameType === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
    }

    return result;
  }, [games, search, typeFilter, statusFilter]);

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
        <input
          type="text"
          placeholder="Search games…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          {GAME_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
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
            <p className="text-sm font-medium text-slate-400">No games match your filters</p>
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
              className="mt-2 text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <GameEmptyState teamId={teamId} canEdit={canEdit} />
        )
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 mb-1">
            {filtered.length} {filtered.length === 1 ? "analysis" : "analyses"}
            {hasFilters ? " matching filters" : ""}
          </p>
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              teamId={teamId}
              hasVideo={videoStatus[game.id] === true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
