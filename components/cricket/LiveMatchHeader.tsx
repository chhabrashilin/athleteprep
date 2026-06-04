"use client";

import type { CricketLiveMatchState } from "@/lib/cricket/live-scoring/queries";

interface PlayerMap {
  [id: string]: string;
}

interface TeamMap {
  [id: string]: string;
}

interface Props {
  liveState: CricketLiveMatchState;
  playerNames?: PlayerMap;
  teamNames?: TeamMap;
  matchTitle?: string;
}

export function LiveMatchHeader({ liveState, playerNames = {}, teamNames = {}, matchTitle }: Props) {
  const battingTeamName = liveState.battingTeamId ? (teamNames[liveState.battingTeamId] ?? "Batting") : "Batting";
  const strikerName = liveState.strikerId ? (playerNames[liveState.strikerId] ?? "—") : "—";
  const nonStrikerName = liveState.nonStrikerId ? (playerNames[liveState.nonStrikerId] ?? "—") : "—";
  const bowlerName = liveState.bowlerId ? (playerNames[liveState.bowlerId] ?? "—") : "—";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      {matchTitle && (
        <p className="text-xs text-slate-500 mb-2">{matchTitle}</p>
      )}

      {/* Score line */}
      <div className="flex items-end gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-0.5">{battingTeamName}</p>
          <p className="text-4xl font-bold text-slate-100 tabular-nums leading-none">
            {liveState.totalRuns}/{liveState.wicketsLost}
          </p>
        </div>
        <div className="mb-1">
          <p className="text-lg text-slate-400 tabular-nums">({liveState.oversText})</p>
        </div>
        {liveState.targetRuns && (
          <div className="ml-auto text-right mb-1">
            <p className="text-xs text-slate-500">Target</p>
            <p className="text-xl font-semibold text-sky-400">{liveState.targetRuns}</p>
            <p className="text-xs text-slate-500">
              Need {Math.max(0, liveState.targetRuns - liveState.totalRuns)} more
            </p>
          </div>
        )}
      </div>

      {/* Run rates */}
      <div className="flex gap-4 mb-3 text-xs">
        {liveState.currentRunRate !== null && (
          <div>
            <span className="text-slate-500">CRR </span>
            <span className="text-slate-200 font-semibold tabular-nums">{liveState.currentRunRate.toFixed(2)}</span>
          </div>
        )}
        {liveState.requiredRunRate !== null && (
          <div>
            <span className="text-slate-500">RRR </span>
            <span className={`font-semibold tabular-nums ${liveState.requiredRunRate > (liveState.currentRunRate ?? 0) ? "text-red-400" : "text-emerald-400"}`}>
              {liveState.requiredRunRate.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-800 pt-3">
        <div>
          <p className="text-slate-500 mb-0.5">Striker</p>
          <p className="text-slate-200 font-medium truncate">{strikerName} *</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Non-striker</p>
          <p className="text-slate-200 font-medium truncate">{nonStrikerName}</p>
        </div>
        <div>
          <p className="text-slate-500 mb-0.5">Bowler</p>
          <p className="text-slate-200 font-medium truncate">{bowlerName}</p>
        </div>
      </div>
    </div>
  );
}
