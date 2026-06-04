"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { rebuildCricketLeagueStandings } from "@/lib/cricket/standings/actions";

interface Props {
  leagueId: string;
  variant?: "default" | "primary";
  onComplete?: () => void;
}

export function RebuildStandingsButton({ leagueId, variant = "default", onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRebuild() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await rebuildCricketLeagueStandings({
        leagueId,
        includeUnpublishedMatches: false,
        includeIncompletescorecards: false,
        nrrUseFullQuotaWhenAllOut: true,
        snapshot: true,
      });
      if (result.success && result.data) {
        setMessage(`Rebuilt: ${result.data.teamsUpdated} teams, ${result.data.matchesProcessed} matches.`);
        onComplete?.();
        // Refresh page data
        setTimeout(() => window.location.reload(), 800);
      } else {
        setMessage(result.error ?? "Rebuild failed.");
      }
    } catch {
      setMessage("Unexpected error during rebuild.");
    } finally {
      setLoading(false);
    }
  }

  const baseClass = variant === "primary"
    ? "inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors disabled:opacity-50"
    : "inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:border-sky-500/40 hover:bg-slate-700 transition-all disabled:opacity-50";

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleRebuild} disabled={loading} className={baseClass}>
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Rebuilding…" : "Rebuild Standings"}
      </button>
      {message && (
        <span className="text-xs text-slate-400">{message}</span>
      )}
    </div>
  );
}
