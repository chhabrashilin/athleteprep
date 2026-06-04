"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LiveMatchHeader } from "./LiveMatchHeader";
import { LiveScoringKeypad } from "./LiveScoringKeypad";
import { RecentBallsList } from "./RecentBallsList";
import { recordBallEvent, undoLastBallEvent, pauseLiveScoring, resumeLiveScoring, endInnings, completeLiveScoring, startLiveScoring, setNextBatter, setNextBowler } from "@/lib/cricket/live-scoring/actions";
import type { CricketLiveMatchState, CricketBallEvent } from "@/lib/cricket/live-scoring/queries";
import type { BallEventInput } from "@/lib/cricket/validation/live-scoring";

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
  homeTeam: TeamOption;
  awayTeam: TeamOption;
  initialLiveState: CricketLiveMatchState | null;
  initialEvents: CricketBallEvent[];
  squadPlayers: PlayerOption[];
  canScore: boolean;
  scorecardStatus: string;
  leagueSlug?: string | null;
}

export function LiveScoringClient({
  matchId,
  matchSlug,
  homeTeam,
  awayTeam,
  initialLiveState,
  initialEvents,
  squadPlayers,
  canScore,
  scorecardStatus,
  leagueSlug,
}: Props) {
  const router = useRouter();
  const [liveState, setLiveState] = useState<CricketLiveMatchState | null>(initialLiveState);
  const [events, setEvents] = useState<CricketBallEvent[]>(initialEvents);
  const [status, setStatus] = useState<string>(initialLiveState?.status ?? "not_started");
  const [error, setError] = useState<string | null>(null);
  const [showStartPanel, setShowStartPanel] = useState(!initialLiveState || initialLiveState.status === "not_started");
  const [showNewBatterPanel, setShowNewBatterPanel] = useState(false);
  const [showNewBowlerPanel, setShowNewBowlerPanel] = useState(false);
  const [selectedNewBatter, setSelectedNewBatter] = useState("");
  const [selectedNewBowler, setSelectedNewBowler] = useState("");

  // Start panel state
  const [startBattingTeamId, setStartBattingTeamId] = useState(homeTeam.id);
  const [startBowlingTeamId, setStartBowlingTeamId] = useState(awayTeam.id);
  const [startStrikerId, setStartStrikerId] = useState("");
  const [startNonStrikerId, setStartNonStrikerId] = useState("");
  const [startBowlerId, setStartBowlerId] = useState("");
  const [starting, setStarting] = useState(false);

  // Derive current ball number from live state
  const currentOver = liveState ? Math.floor(liveState.ballsBowled / 6) : 0;
  const currentBallInOver = liveState ? liveState.ballsBowled % 6 : 0;

  const teamNames: Record<string, string> = {
    [homeTeam.id]: homeTeam.name,
    [awayTeam.id]: awayTeam.name,
  };
  const playerNames: Record<string, string> = Object.fromEntries(squadPlayers.map((p) => [p.id, p.name]));

  async function handleStartLiveScoring() {
    if (!startStrikerId || !startNonStrikerId || !startBowlerId) {
      setError("Select striker, non-striker, and bowler");
      return;
    }
    if (startStrikerId === startNonStrikerId) {
      setError("Striker and non-striker must be different players");
      return;
    }
    setStarting(true);
    setError(null);
    const result = await startLiveScoring({
      match_id: matchId,
      batting_team_id: startBattingTeamId,
      bowling_team_id: startBowlingTeamId,
      striker_id: startStrikerId,
      non_striker_id: startNonStrikerId,
      bowler_id: startBowlerId,
    });
    setStarting(false);
    if (!result.success) {
      setError(result.error ?? "Failed to start live scoring");
      return;
    }
    if (result.data) {
      setLiveState(result.data);
      setStatus("live");
      setShowStartPanel(false);
    }
  }

  const handleBallRecorded = useCallback((event: CricketBallEvent, newState: CricketLiveMatchState) => {
    setEvents((prev) => [...prev.filter((e) => e.id !== event.id), event]);
    setLiveState(newState);
    setStatus(newState.status);
  }, []);

  const handleUndo = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handlePause() {
    const result = await pauseLiveScoring(matchId);
    if (!result.success) { setError(result.error ?? "Failed to pause"); return; }
    setStatus("paused");
    if (liveState) setLiveState({ ...liveState, status: "paused" });
  }

  async function handleResume() {
    const result = await resumeLiveScoring(matchId);
    if (!result.success) { setError(result.error ?? "Failed to resume"); return; }
    setStatus("live");
    if (liveState) setLiveState({ ...liveState, status: "live" });
  }

  async function handleEndInnings() {
    if (!liveState?.inningsId) return;
    const confirmed = window.confirm("End the current innings?");
    if (!confirmed) return;
    const result = await endInnings(matchId, liveState.inningsId, "manual");
    if (!result.success) { setError(result.error ?? "Failed to end innings"); return; }
    setStatus((result.data as { nextStatus: string })?.nextStatus ?? "innings_break");
    router.refresh();
  }

  async function handleComplete() {
    const confirmed = window.confirm("Complete live scoring? This will mark the match as completed.");
    if (!confirmed) return;
    const result = await completeLiveScoring(matchId);
    if (!result.success) { setError(result.error ?? "Failed to complete"); return; }
    setStatus("completed");
    router.refresh();
  }

  async function handleConfirmNewBatter() {
    if (!selectedNewBatter) return;
    const result = await setNextBatter(matchId, selectedNewBatter);
    if (!result.success) { setError(result.error ?? "Failed to set batter"); return; }
    if (result.data) setLiveState(result.data);
    setShowNewBatterPanel(false);
    setSelectedNewBatter("");
  }

  async function handleConfirmNewBowler() {
    if (!selectedNewBowler) return;
    const result = await setNextBowler(matchId, selectedNewBowler);
    if (!result.success) { setError(result.error ?? "Failed to set bowler"); return; }
    if (result.data) setLiveState(result.data);
    setShowNewBowlerPanel(false);
    setSelectedNewBowler("");
  }

  const scorerMatchLink = `/cricket/matches/${matchSlug}`;
  const viewerLink = `/cricket/matches/${matchSlug}/live`;
  const scorecardLink = `/cricket/matches/${matchSlug}/scorecard`;

  if (!canScore) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-400 mb-4">You do not have permission to score this match.</p>
        <Link href={scorecardLink} className="text-sky-400 hover:underline text-sm">View Scorecard</Link>
      </div>
    );
  }

  if (scorecardStatus === "not_started") {
    return (
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center space-y-3">
        <p className="text-yellow-300 font-semibold">Match setup is incomplete.</p>
        <p className="text-sm text-slate-400">Complete match setup (toss, playing XI) before starting live scoring.</p>
        <Link
          href={`/cricket/matches/${matchSlug}/setup`}
          className="inline-block rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Complete Match Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Link href={scorerMatchLink} className="text-slate-500 hover:text-slate-300">← Match</Link>
        <span className="text-slate-700">|</span>
        <Link href={scorecardLink} className="text-slate-500 hover:text-slate-300">Scorecard</Link>
        <span className="text-slate-700">|</span>
        <Link href={viewerLink} className="text-slate-500 hover:text-slate-300">Viewer Link ↗</Link>
        {leagueSlug && (
          <>
            <span className="text-slate-700">|</span>
            <Link href={`/cricket/leagues/${leagueSlug}/schedule`} className="text-slate-500 hover:text-slate-300">Schedule</Link>
          </>
        )}
        {status === "completed" && (
          <>
            <span className="text-slate-700">|</span>
            <Link href={`/cricket/matches/${matchSlug}/result`} className="text-emerald-400 hover:text-emerald-300 font-medium">Finalize Result →</Link>
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-3">✕</button>
        </div>
      )}

      {/* Start panel */}
      {showStartPanel ? (
        <div className="rounded-xl border border-sky-500/20 bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Start Live Scoring</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Batting team</label>
              <select value={startBattingTeamId} onChange={(e) => { setStartBattingTeamId(e.target.value); setStartBowlingTeamId(e.target.value === homeTeam.id ? awayTeam.id : homeTeam.id); }}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value={homeTeam.id}>{homeTeam.name}</option>
                <option value={awayTeam.id}>{awayTeam.name}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bowling team</label>
              <p className="text-sm text-slate-300 py-1.5">{startBowlingTeamId === homeTeam.id ? homeTeam.name : awayTeam.name}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Striker (opening batter)</label>
              <select value={startStrikerId} onChange={(e) => setStartStrikerId(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Select —</option>
                {squadPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Non-striker</label>
              <select value={startNonStrikerId} onChange={(e) => setStartNonStrikerId(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Select —</option>
                {squadPlayers.filter((p) => p.id !== startStrikerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Opening bowler</label>
              <select value={startBowlerId} onChange={(e) => setStartBowlerId(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Select —</option>
                {squadPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleStartLiveScoring} disabled={starting}
            className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
            {starting ? "Starting…" : "Start Live Scoring"}
          </button>
        </div>
      ) : (
        <>
          {/* Live header */}
          {liveState && (
            <LiveMatchHeader liveState={liveState} playerNames={playerNames} teamNames={teamNames} />
          )}

          {/* Paused/Completed state */}
          {status === "paused" && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex justify-between items-center">
              <p className="text-sm text-yellow-300 font-medium">Scoring paused</p>
              <button onClick={handleResume} className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
                Resume
              </button>
            </div>
          )}

          {status === "innings_break" && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 space-y-2">
              <p className="text-sm text-orange-300 font-semibold">Innings break</p>
              <p className="text-xs text-slate-400">Set up the next innings to continue scoring.</p>
              <button onClick={() => setShowStartPanel(true)}
                className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500">
                Start 2nd Innings
              </button>
            </div>
          )}

          {status === "completed" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-2">
              <p className="text-sm text-emerald-300 font-semibold">Live scoring complete</p>
              <div className="flex gap-2">
                <Link href={`/cricket/matches/${matchSlug}/result`}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500">
                  Finalize Result
                </Link>
                <Link href={scorecardLink}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm text-slate-200 hover:bg-slate-700">
                  View Scorecard
                </Link>
              </div>
            </div>
          )}

          {/* Keypad */}
          {status === "live" && liveState && liveState.inningsId && (
            <LiveScoringKeypad
              matchId={matchId}
              inningsId={liveState.inningsId}
              liveState={liveState}
              overNumber={currentOver}
              ballInOver={currentBallInOver}
              playerOptions={squadPlayers}
              onBallRecorded={handleBallRecorded}
              onUndo={handleUndo}
              onPause={handlePause}
              onEndInnings={handleEndInnings}
              onNeedNewBatter={() => setShowNewBatterPanel(true)}
              onNeedNewBowler={() => setShowNewBowlerPanel(true)}
              recordBallAction={recordBallEvent}
              undoAction={undoLastBallEvent}
            />
          )}

          {/* New batter panel */}
          {showNewBatterPanel && (
            <div className="rounded-xl border border-red-500/30 bg-slate-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-300">Wicket — select new batter</p>
              <select value={selectedNewBatter} onChange={(e) => setSelectedNewBatter(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Select new batter —</option>
                {squadPlayers.filter((p) => p.id !== liveState?.nonStrikerId).map((p) =>
                  <option key={p.id} value={p.id}>{p.name}</option>
                )}
              </select>
              <div className="flex gap-2">
                <button onClick={handleConfirmNewBatter} disabled={!selectedNewBatter}
                  className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
                  Confirm
                </button>
                <button onClick={() => setShowNewBatterPanel(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* New bowler panel */}
          {showNewBowlerPanel && (
            <div className="rounded-xl border border-orange-500/30 bg-slate-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-orange-300">End of over — select next bowler</p>
              <select value={selectedNewBowler} onChange={(e) => setSelectedNewBowler(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200">
                <option value="">— Select bowler —</option>
                {squadPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={handleConfirmNewBowler} disabled={!selectedNewBowler}
                  className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
                  Confirm
                </button>
                <button onClick={() => setShowNewBowlerPanel(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Recent balls */}
          <RecentBallsList events={events} canCorrect={true} />

          {/* Complete scoring button */}
          {status === "live" && (
            <div className="flex justify-end">
              <button onClick={handleComplete}
                className="text-xs text-slate-600 hover:text-orange-400 transition-colors">
                Complete Live Scoring
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
