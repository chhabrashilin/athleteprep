"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrUpdateCricketInnings,
  saveBattingScorecardEntries,
  saveBowlingScorecardEntries,
  saveFallOfWickets,
  validateAndCompleteScorecard,
} from "@/app/actions/cricket-scorecard";
import { INNINGS_STATUSES } from "@/lib/cricket/validation/scorecard";
import { ballsToOversText, calculateStrikeRate, calculateEconomyRate } from "@/lib/cricket/scorecards/calculations";
import type { CricketFullScorecard, CricketInnings } from "@/lib/cricket/types";

interface ScorecardEditorProps {
  scorecard: CricketFullScorecard;
  matchSlug: string;
}

export function ScorecardEditor({ scorecard, matchSlug }: ScorecardEditorProps) {
  const router = useRouter();
  const { match, innings, battingEntries, bowlingEntries, fallOfWickets, squads, homeTeam, awayTeam } = scorecard;

  const [activeInningsNumber, setActiveInningsNumber] = useState<number>(
    innings.length > 0 ? innings[innings.length - 1].inningsNumber : 1
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Innings form state
  const [inningsRuns, setInningsRuns] = useState<Record<number, string>>({});
  const [inningsWickets, setInningsWickets] = useState<Record<number, string>>({});
  const [inningsBalls, setInningsBalls] = useState<Record<number, string>>({});
  const [inningsByes, setInningsByes] = useState<Record<number, string>>({});
  const [inningsLByes, setInningsLByes] = useState<Record<number, string>>({});
  const [inningsWides, setInningsWides] = useState<Record<number, string>>({});
  const [inningsNoBalls, setInningsNoBalls] = useState<Record<number, string>>({});
  const [inningsStatus, setInningsStatus] = useState<Record<number, string>>({});

  // Get current innings data
  const currentInnings = innings.find((i) => i.inningsNumber === activeInningsNumber);
  const homeSquad = squads.filter((s) => s.teamId === match.homeTeamId && s.isPlayingXi);
  const awaySquad = squads.filter((s) => s.teamId === match.awayTeamId && s.isPlayingXi);

  // Determine which team bats in each innings
  function getBattingTeamForInnings(n: number): string {
    // Innings 1: if toss winner elected to bat, they bat first; else other team bats first
    if (n === 1) {
      if (match.tossWinnerTeamId && match.tossDecision === "bat") {
        return match.tossWinnerTeamId;
      }
      if (match.tossWinnerTeamId && (match.tossDecision === "bowl" || match.tossDecision === "field")) {
        return match.tossWinnerTeamId === match.homeTeamId
          ? (match.awayTeamId ?? match.homeTeamId ?? "")
          : (match.homeTeamId ?? "");
      }
      return match.homeTeamId ?? "";
    }
    // Innings 2: other team bats
    const inn1BattingTeam = getBattingTeamForInnings(1);
    return inn1BattingTeam === match.homeTeamId ? (match.awayTeamId ?? "") : (match.homeTeamId ?? "");
  }

  const battingTeamId = getBattingTeamForInnings(activeInningsNumber);
  const bowlingTeamId = battingTeamId === match.homeTeamId ? (match.awayTeamId ?? "") : (match.homeTeamId ?? "");

  const battingTeamName = battingTeamId === match.homeTeamId ? (homeTeam?.name ?? "Home") : (awayTeam?.name ?? "Away");
  const bowlingTeamName = bowlingTeamId === match.homeTeamId ? (homeTeam?.name ?? "Home") : (awayTeam?.name ?? "Away");

  const currentBattingEntries = currentInnings ? battingEntries[currentInnings.id] ?? [] : [];
  const currentBowlingEntries = currentInnings ? bowlingEntries[currentInnings.id] ?? [] : [];

  function getInningsValue(state: Record<number, string>, inn: CricketInnings | undefined, field: keyof CricketInnings): string {
    const n = activeInningsNumber;
    if (n in state) return state[n];
    if (inn) return String(inn[field] ?? "");
    return "";
  }

  async function handleSaveInnings() {
    setLoading(true);
    setError(null);

    const runs = parseInt(inningsRuns[activeInningsNumber] ?? String(currentInnings?.totalRuns ?? 0)) || 0;
    const wickets = parseInt(inningsWickets[activeInningsNumber] ?? String(currentInnings?.wicketsLost ?? 0)) || 0;
    const balls = parseInt(inningsBalls[activeInningsNumber] ?? String(currentInnings?.ballsBowled ?? 0)) || 0;
    const byes = parseInt(inningsByes[activeInningsNumber] ?? String(currentInnings?.byes ?? 0)) || 0;
    const legByes = parseInt(inningsLByes[activeInningsNumber] ?? String(currentInnings?.legByes ?? 0)) || 0;
    const wides = parseInt(inningsWides[activeInningsNumber] ?? String(currentInnings?.wides ?? 0)) || 0;
    const noBalls = parseInt(inningsNoBalls[activeInningsNumber] ?? String(currentInnings?.noBalls ?? 0)) || 0;
    const status = (inningsStatus[activeInningsNumber] ?? currentInnings?.inningsStatus ?? "in_progress") as CricketInnings["inningsStatus"];

    const result = await createOrUpdateCricketInnings({
      matchId: match.id,
      inningsNumber: activeInningsNumber,
      battingTeamId,
      bowlingTeamId,
      totalRuns: runs,
      wicketsLost: wickets,
      ballsBowled: balls,
      byes,
      legByes,
      wides,
      noBalls,
      penaltyRuns: 0,
      inningsStatus: status,
      declared: status === "declared",
      allOut: wickets >= 10,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccessMsg("Innings saved.");
      router.refresh();
    }
  }

  async function handleCompleteScorecard() {
    setLoading(true);
    setError(null);
    const result = await validateAndCompleteScorecard(match.id);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else {
      if (result.data.warnings.length > 0) {
        setSuccessMsg(`Scorecard marked complete with ${result.data.warnings.length} warning(s): ${result.data.warnings[0]}`);
      } else {
        setSuccessMsg("Scorecard completed successfully.");
      }
      router.refresh();
    }
  }

  const inningsNumbers = [1, 2];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm text-emerald-400">{successMsg}</p>
        </div>
      )}

      {/* Innings tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {inningsNumbers.map((n) => (
          <button
            key={n}
            onClick={() => setActiveInningsNumber(n)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeInningsNumber === n
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Innings {n}
          </button>
        ))}
      </div>

      {/* Innings header info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs text-slate-500 mb-1">Innings {activeInningsNumber}</p>
        <p className="text-sm font-medium text-slate-300">
          <span className="text-sky-400">{battingTeamName}</span> batting vs <span className="text-slate-400">{bowlingTeamName}</span>
        </p>
      </div>

      {/* Innings totals editor */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Innings Totals</legend>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Total Runs</label>
            <input
              type="number"
              min={0}
              value={getInningsValue(inningsRuns, currentInnings, "totalRuns")}
              onChange={(e) => setInningsRuns((p) => ({ ...p, [activeInningsNumber]: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Wickets</label>
            <input
              type="number"
              min={0}
              max={10}
              value={getInningsValue(inningsWickets, currentInnings, "wicketsLost")}
              onChange={(e) => setInningsWickets((p) => ({ ...p, [activeInningsNumber]: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Balls Bowled</label>
            <input
              type="number"
              min={0}
              value={getInningsValue(inningsBalls, currentInnings, "ballsBowled")}
              onChange={(e) => setInningsBalls((p) => ({ ...p, [activeInningsNumber]: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Byes", state: inningsByes, setter: setInningsByes, field: "byes" as keyof CricketInnings },
            { label: "Leg Byes", state: inningsLByes, setter: setInningsLByes, field: "legByes" as keyof CricketInnings },
            { label: "Wides", state: inningsWides, setter: setInningsWides, field: "wides" as keyof CricketInnings },
            { label: "No Balls", state: inningsNoBalls, setter: setInningsNoBalls, field: "noBalls" as keyof CricketInnings },
          ].map(({ label, state, setter, field }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input
                type="number"
                min={0}
                value={getInningsValue(state, currentInnings, field)}
                onChange={(e) => setter((p) => ({ ...p, [activeInningsNumber]: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Innings Status</label>
          <select
            value={inningsStatus[activeInningsNumber] ?? currentInnings?.inningsStatus ?? "in_progress"}
            onChange={(e) => setInningsStatus((p) => ({ ...p, [activeInningsNumber]: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            {INNINGS_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSaveInnings}
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save Innings"}
        </button>
      </fieldset>

      {/* Batting entries summary (read-only display, editable via individual entry forms below) */}
      {currentBattingEntries.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Batting — {currentBattingEntries.length} entries saved</h3>
          <div className="space-y-1">
            {[...currentBattingEntries]
              .sort((a, b) => (a.battingPosition ?? 99) - (b.battingPosition ?? 99))
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
                  <span className="text-slate-300">{entry.playerName}</span>
                  <span className="text-slate-400">
                    {entry.didNotBat ? "DNB" : `${entry.runs} (${entry.balls})`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bowling entries summary */}
      {currentBowlingEntries.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Bowling — {currentBowlingEntries.length} entries saved</h3>
          <div className="space-y-1">
            {currentBowlingEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
                <span className="text-slate-300">{entry.playerName}</span>
                <span className="text-slate-400">
                  {entry.oversText} — {entry.runsConceded}/{entry.wickets}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick entry note */}
      <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-4">
        <p className="text-xs text-slate-500">
          Full per-player batting and bowling entry forms are available.
          Use the &quot;Save Innings&quot; form above to set totals, then add individual player entries via the APIs or the full edit forms.
          Ball-by-ball scoring is coming in Prompt 33.
        </p>
      </div>

      {/* Complete scorecard */}
      {match.scorecardStatus === "in_progress" && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-1">Complete Scorecard</h3>
          <p className="text-xs text-slate-400 mb-3">
            Mark the scorecard as complete when all innings data has been entered.
            A consistency check will run before completing.
          </p>
          <button
            onClick={handleCompleteScorecard}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Completing…" : "Mark Scorecard Complete"}
          </button>
        </div>
      )}
    </div>
  );
}
