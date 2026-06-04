"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startCricketMatchSetup,
  saveCricketMatchSquads,
  recordCricketToss,
} from "@/app/actions/cricket-scorecard";
import { TOSS_DECISIONS } from "@/lib/cricket/validation/scorecard";
import type { MatchSetupData } from "@/lib/cricket/match-setup/queries";

interface MatchSetupFormProps {
  setupData: MatchSetupData;
  matchSlug: string;
}

export function MatchSetupForm({ setupData, matchSlug }: MatchSetupFormProps) {
  const router = useRouter();
  const { match, homeTeam, awayTeam, homeRoster, awayRoster, squads } = setupData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Toss state
  const [tossWinner, setTossWinner] = useState(match.tossWinnerTeamId ?? "");
  const [tossDecision, setTossDecision] = useState(match.tossDecision ?? "");

  // Squad state — start from existing squads or all roster players selected
  const existingHomeIds = new Set(squads.filter((s) => s.teamId === match.homeTeamId).map((s) => s.playerId));
  const existingAwayIds = new Set(squads.filter((s) => s.teamId === match.awayTeamId).map((s) => s.playerId));

  const [homeSelected, setHomeSelected] = useState<Set<string>>(
    existingHomeIds.size > 0 ? existingHomeIds : new Set()
  );
  const [awaySelected, setAwaySelected] = useState<Set<string>>(
    existingAwayIds.size > 0 ? existingAwayIds : new Set()
  );

  function togglePlayer(set: Set<string>, setFn: (s: Set<string>) => void, playerId: string) {
    const next = new Set(set);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    setFn(next);
  }

  async function handleStartSetup() {
    if (match.scorecardStatus !== "not_started") return;
    setLoading(true);
    const result = await startCricketMatchSetup(match.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  async function handleSaveSquads() {
    if (!match.homeTeamId || !match.awayTeamId) {
      setError("Match is missing team assignments.");
      return;
    }
    setLoading(true);
    setError(null);

    const homeSquad = Array.from(homeSelected).map((id) => ({ playerId: id, isPlayingXi: true }));
    const awaySquad = Array.from(awaySelected).map((id) => ({ playerId: id, isPlayingXi: true }));

    const result = await saveCricketMatchSquads({
      matchId: match.id,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeSquad,
      awaySquad,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(`Saved ${result.data.saved} squad players.`);
      router.refresh();
    }
  }

  async function handleSaveToss() {
    if (!tossWinner || !tossDecision) {
      setError("Please select toss winner and decision.");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await recordCricketToss({
      matchId: match.id,
      tossWinnerTeamId: tossWinner,
      tossDecision,
      homeTeamId: match.homeTeamId ?? "",
      awayTeamId: match.awayTeamId ?? "",
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess("Toss recorded.");
      router.refresh();
    }
  }

  const statusLabel = match.scorecardStatus.replace(/_/g, " ");
  const showStartButton = match.scorecardStatus === "not_started";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Scorecard status */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Scorecard status:</span>
        <span className="text-xs font-medium text-slate-300 capitalize">{statusLabel}</span>
        {showStartButton && (
          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
          >
            Start Setup
          </button>
        )}
      </div>

      {/* Playing XI */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Playing XI Selection</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Home team */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">
              {homeTeam?.name ?? "Home Team"} ({homeSelected.size} selected)
            </p>
            {homeRoster.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No roster players found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(homeRoster as Array<{ cricketPlayerId?: string; id?: string; player?: { id?: string; display_name?: string; displayName?: string } }>).map((entry) => {
                  const playerId = entry.cricketPlayerId ?? (entry.player as Record<string, string> | undefined)?.id ?? "";
                  const name = (entry.player as Record<string, string> | undefined)?.display_name
                    ?? (entry.player as Record<string, string> | undefined)?.displayName
                    ?? playerId.slice(0, 8);
                  return (
                    <label key={playerId} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={homeSelected.has(playerId)}
                        onChange={() => togglePlayer(homeSelected, setHomeSelected, playerId)}
                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-sky-500"
                      />
                      <span className={homeSelected.has(playerId) ? "text-slate-200" : "text-slate-500"}>
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Away team */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">
              {awayTeam?.name ?? "Away Team"} ({awaySelected.size} selected)
            </p>
            {awayRoster.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No roster players found</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(awayRoster as Array<{ cricketPlayerId?: string; id?: string; player?: { id?: string; display_name?: string; displayName?: string } }>).map((entry) => {
                  const playerId = entry.cricketPlayerId ?? (entry.player as Record<string, string> | undefined)?.id ?? "";
                  const name = (entry.player as Record<string, string> | undefined)?.display_name
                    ?? (entry.player as Record<string, string> | undefined)?.displayName
                    ?? playerId.slice(0, 8);
                  return (
                    <label key={playerId} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={awaySelected.has(playerId)}
                        onChange={() => togglePlayer(awaySelected, setAwaySelected, playerId)}
                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-sky-500"
                      />
                      <span className={awaySelected.has(playerId) ? "text-slate-200" : "text-slate-500"}>
                        {name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSaveSquads}
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save Playing XIs"}
        </button>
      </div>

      {/* Toss */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Toss</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Toss Won By</label>
            <select
              value={tossWinner}
              onChange={(e) => setTossWinner(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select team…</option>
              {match.homeTeamId && homeTeam && (
                <option value={match.homeTeamId}>{homeTeam.name}</option>
              )}
              {match.awayTeamId && awayTeam && (
                <option value={match.awayTeamId}>{awayTeam.name}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Elected To</label>
            <select
              value={tossDecision}
              onChange={(e) => setTossDecision(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select…</option>
              {TOSS_DECISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveToss}
          disabled={loading || !tossWinner || !tossDecision}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save Toss"}
        </button>
      </div>
    </div>
  );
}
