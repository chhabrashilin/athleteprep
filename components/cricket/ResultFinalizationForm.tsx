"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeCricketMatchResult } from "@/app/actions/cricket-scorecard";
import { RESULT_TYPES } from "@/lib/cricket/validation/scorecard";
import type { MatchResultOutput } from "@/lib/cricket/scorecards/calculations";

interface ResultFinalizationFormProps {
  matchId: string;
  matchSlug: string;
  homeTeamId: string;
  awayTeamId: string;
  suggestedResult: MatchResultOutput | null;
}

export function ResultFinalizationForm({
  matchId,
  matchSlug,
  homeTeamId,
  awayTeamId,
  suggestedResult,
}: ResultFinalizationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultType, setResultType] = useState(suggestedResult?.resultType ?? "unknown");
  const [winningTeamId, setWinningTeamId] = useState(suggestedResult?.winnerTeamId ?? "");
  const [marginRuns, setMarginRuns] = useState(suggestedResult?.marginRuns?.toString() ?? "");
  const [marginWickets, setMarginWickets] = useState(suggestedResult?.marginWickets?.toString() ?? "");
  const [resultSummary, setResultSummary] = useState(suggestedResult?.resultSummary ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await finalizeCricketMatchResult({
      matchId,
      resultType,
      winningTeamId: winningTeamId || null,
      losingTeamId: winningTeamId
        ? (winningTeamId === homeTeamId ? awayTeamId : homeTeamId)
        : null,
      marginRuns: marginRuns ? parseInt(marginRuns) : null,
      marginWickets: marginWickets ? parseInt(marginWickets) : null,
      resultSummary: resultSummary || null,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      router.push(`/cricket/matches/${matchSlug}/scorecard`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Result Type</label>
        <select
          value={resultType}
          onChange={(e) => setResultType(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
        >
          {RESULT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {(resultType === "home_win" || resultType === "away_win") && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Winning Team ID</label>
            <select
              value={winningTeamId}
              onChange={(e) => setWinningTeamId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="">Select…</option>
              <option value={homeTeamId}>Home Team</option>
              <option value={awayTeamId}>Away Team</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Margin (runs)</label>
              <input
                type="number"
                min={0}
                value={marginRuns}
                onChange={(e) => setMarginRuns(e.target.value)}
                placeholder="e.g. 4"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Margin (wickets)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={marginWickets}
                onChange={(e) => setMarginWickets(e.target.value)}
                placeholder="e.g. 3"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Result Summary</label>
        <input
          type="text"
          value={resultSummary}
          onChange={(e) => setResultSummary(e.target.value)}
          placeholder="e.g. Madison Strikers won by 4 runs"
          maxLength={500}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Finalizing…" : "Finalize Result"}
      </button>
    </form>
  );
}
