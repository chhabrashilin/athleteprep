"use client";

import Link from "next/link";
import { useLiveMatchState } from "@/lib/cricket/live-scoring/realtime";
import { LiveMatchHeader } from "./LiveMatchHeader";
import { RecentBallsList } from "./RecentBallsList";
import type { CricketLiveMatchState, CricketBallEvent } from "@/lib/cricket/live-scoring/queries";

interface PlayerOption {
  id: string;
  name: string;
}

interface TeamOption {
  id: string;
  name: string;
}

interface Props {
  matchId: string;
  matchSlug: string;
  matchTitle: string;
  homeTeam: TeamOption;
  awayTeam: TeamOption;
  initialLiveState: CricketLiveMatchState | null;
  initialEvents: CricketBallEvent[];
  playerNames: Record<string, string>;
  scorecardLink: string;
  matchInfoLink: string;
  scorerLink?: string;
  canScore?: boolean;
}

export function LiveViewerClient({
  matchId,
  matchTitle,
  homeTeam,
  awayTeam,
  initialLiveState,
  initialEvents,
  playerNames,
  matchSlug: _matchSlug,
  scorecardLink,
  matchInfoLink,
  scorerLink,
  canScore,
}: Props) {
  const { liveState, recentEvents, isConnected, lastUpdated, refresh } = useLiveMatchState(matchId, {
    initialState: initialLiveState,
    initialEvents,
    pollIntervalMs: 12000,
  });

  const teamNames: Record<string, string> = {
    [homeTeam.id]: homeTeam.name,
    [awayTeam.id]: awayTeam.name,
  };

  const isCompleted = liveState?.status === "completed";
  const notStarted = !liveState || liveState.status === "not_started";

  return (
    <div className="space-y-4">
      {/* Connection indicator */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-slate-600"}`} />
          <span className="text-slate-500">{isConnected ? "Live" : "Polling"}</span>
          {lastUpdated && (
            <span className="text-slate-600 ml-1">
              · Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <button onClick={refresh} className="text-slate-600 hover:text-slate-400 transition-colors">
          ↺ Refresh
        </button>
      </div>

      {/* Not started */}
      {notStarted && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center space-y-3">
          <p className="text-slate-400 font-medium">Live scoring has not started yet.</p>
          <p className="text-sm text-slate-600">{matchTitle}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Link href={matchInfoLink} className="text-xs text-sky-400 hover:underline">Match Info</Link>
            <span className="text-slate-700">·</span>
            <Link href={scorecardLink} className="text-xs text-sky-400 hover:underline">Scorecard</Link>
          </div>
        </div>
      )}

      {/* Completed */}
      {isCompleted && liveState && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-300 mb-1">Match completed</p>
          <p className="text-xs text-slate-400">Live scoring has ended. Check the final scorecard.</p>
        </div>
      )}

      {/* Live or completed scoreboard */}
      {liveState && !notStarted && (
        <>
          <LiveMatchHeader
            liveState={liveState}
            playerNames={playerNames}
            teamNames={teamNames}
            matchTitle={matchTitle}
          />
          <RecentBallsList events={recentEvents} canCorrect={false} />
        </>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm border-t border-slate-800 pt-4">
        <Link href={scorecardLink} className="text-sky-400 hover:underline">
          Full Scorecard →
        </Link>
        <Link href={matchInfoLink} className="text-slate-400 hover:text-slate-200">
          Match Info
        </Link>
        {canScore && scorerLink && (
          <Link href={scorerLink} className="text-orange-400 hover:underline">
            Open Scorer →
          </Link>
        )}
      </div>
    </div>
  );
}
