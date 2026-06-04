"use client";

import { useState, useTransition } from "react";
import type { CricketLiveMatchState, CricketBallEvent } from "@/lib/cricket/live-scoring/queries";
import type { BallEventInput } from "@/lib/cricket/validation/live-scoring";

interface PlayerOption {
  id: string;
  name: string;
}

interface Props {
  matchId: string;
  inningsId: string;
  liveState: CricketLiveMatchState;
  overNumber: number;
  ballInOver: number;
  playerOptions: PlayerOption[];
  onBallRecorded: (event: CricketBallEvent, newState: CricketLiveMatchState) => void;
  onUndo: () => void;
  onPause: () => void;
  onEndInnings: () => void;
  onNeedNewBatter?: () => void;
  onNeedNewBowler?: () => void;
  recordBallAction: (input: BallEventInput) => Promise<{ success: boolean; data?: { event: CricketBallEvent; liveState: CricketLiveMatchState }; error?: string; warnings?: string[] }>;
  undoAction: (matchId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
}

type PendingExtra = "wide" | "no_ball" | "bye" | "leg_bye" | null;

export function LiveScoringKeypad({
  matchId,
  inningsId,
  liveState,
  overNumber,
  ballInOver,
  playerOptions,
  onBallRecorded,
  onUndo,
  onPause,
  onEndInnings,
  onNeedNewBatter,
  onNeedNewBowler,
  recordBallAction,
  undoAction,
}: Props) {
  const [pendingExtra, setPendingExtra] = useState<PendingExtra>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showShotDetails, setShowShotDetails] = useState(false);
  const [wicketType, setWicketType] = useState("");
  const [playerOutId, setPlayerOutId] = useState("");
  const [fielderPlayerId, setFielderPlayerId] = useState("");
  const [commentary, setCommentary] = useState("");
  const [extraRuns, setExtraRuns] = useState(1);
  // Shot detail fields (optional analytics data)
  const [shotType, setShotType] = useState("");
  const [wagonZone, setWagonZone] = useState("");
  const [batContactType, setBatContactType] = useState("");
  const [fieldingPositionDetail, setFieldingPositionDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const strikerId = liveState.strikerId ?? "";
  const nonStrikerId = liveState.nonStrikerId ?? "";
  const bowlerId = liveState.bowlerId ?? "";

  async function submit(runsBatter: number, extras?: { type: PendingExtra; runs: number }) {
    setError(null);
    setWarning(null);

    const extraType = extras?.type ?? pendingExtra;
    const runsExtras = extraType ? (extras?.runs ?? extraRuns) : 0;
    const isWicket = Boolean(wicketType);

    const input: BallEventInput = {
      match_id: matchId,
      innings_id: inningsId,
      over_number: overNumber,
      ball_in_over: ballInOver,
      striker_id: strikerId,
      non_striker_id: nonStrikerId,
      bowler_id: bowlerId,
      runs_batter: runsBatter,
      runs_extras: runsExtras,
      extra_type: extraType ?? undefined,
      wicket_type: isWicket ? (wicketType as BallEventInput["wicket_type"]) : undefined,
      player_out_id: isWicket && playerOutId ? playerOutId : undefined,
      fielder_player_id: fielderPlayerId || undefined,
      commentary: commentary || undefined,
      // Optional shot detail fields
      shot_type: shotType || undefined,
      wagon_zone: wagonZone || undefined,
      bat_contact_type: batContactType || undefined,
      fielding_position: fieldingPositionDetail || undefined,
    };

    startTransition(async () => {
      const result = await recordBallAction(input);
      if (!result.success) {
        setError(result.error ?? "Failed to record ball");
        return;
      }
      if (result.warnings?.length) setWarning(result.warnings[0]);

      // Reset UI state
      setPendingExtra(null);
      setShowAdvanced(false);
      setWicketType("");
      setPlayerOutId("");
      setFielderPlayerId("");
      setCommentary("");
      setExtraRuns(1);
      // Reset shot details (keep panel open so scorer can re-enter for next ball)
      setShotType("");
      setWagonZone("");
      setBatContactType("");
      setFieldingPositionDetail("");

      if (result.data) {
        onBallRecorded(result.data.event, result.data.liveState);

        // Prompt for new batter if wicket
        if (isWicket && onNeedNewBatter) onNeedNewBatter();

        // Prompt for new bowler if end of over
        if (result.data.liveState.ballsBowled % 6 === 0 && result.data.liveState.ballsBowled > 0 && onNeedNewBowler) {
          onNeedNewBowler();
        }
      }
    });
  }

  async function handleUndo() {
    setError(null);
    startTransition(async () => {
      const result = await undoAction(matchId, "Scorer undo");
      if (!result.success) {
        setError(result.error ?? "Failed to undo");
        return;
      }
      onUndo();
    });
  }

  const runButtons = [0, 1, 2, 3, 4, 5, 6] as const;
  const extraButtons: { label: string; type: PendingExtra }[] = [
    { label: "Wide", type: "wide" },
    { label: "No Ball", type: "no_ball" },
    { label: "Bye", type: "bye" },
    { label: "Leg Bye", type: "leg_bye" },
  ];

  const wicketOptions = [
    "bowled", "caught", "caught_behind", "lbw", "run_out", "stumped",
    "hit_wicket", "retired_hurt", "retired_out", "obstructing_field", "other",
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
      {/* Active extra indicator */}
      {pendingExtra && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2">
          <span className="text-xs font-semibold text-yellow-300 uppercase">{pendingExtra.replace("_", " ")}</span>
          <span className="text-xs text-slate-400">— select runs, then tap score</span>
          {(pendingExtra === "bye" || pendingExtra === "leg_bye") && (
            <input
              type="number"
              min={1}
              max={6}
              value={extraRuns}
              onChange={(e) => setExtraRuns(Number(e.target.value))}
              className="ml-auto w-14 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
            />
          )}
          <button
            onClick={() => setPendingExtra(null)}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Run buttons */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {runButtons.map((r) => (
          <button
            key={r}
            onClick={() => submit(r)}
            disabled={isPending}
            className={`
              rounded-xl border py-4 text-xl font-bold transition-all active:scale-95
              ${r === 4 ? "border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20" :
                r === 6 ? "border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20" :
                  "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"}
              disabled:opacity-50
            `}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Extras row */}
      <div className="grid grid-cols-4 gap-2">
        {extraButtons.map(({ label, type }) => (
          <button
            key={type}
            onClick={() => {
              if (pendingExtra === type) {
                // Confirm wide/no-ball with 1 extra
                if (type === "wide" || type === "no_ball") {
                  submit(0, { type, runs: 1 });
                } else {
                  setPendingExtra(null);
                }
              } else {
                setPendingExtra(type);
                if (type === "wide") submit(0, { type, runs: 1 });
                else if (type === "no_ball") submit(0, { type, runs: 1 });
              }
            }}
            disabled={isPending}
            className={`
              rounded-lg border py-2 text-xs font-medium transition-all
              ${pendingExtra === type
                ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"}
              disabled:opacity-50
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Wicket + Advanced */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
        >
          Wicket / Advanced
        </button>
        <button
          onClick={handleUndo}
          disabled={isPending}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="Undo last ball"
        >
          Undo
        </button>
      </div>

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Wicket type</label>
            <select
              value={wicketType}
              onChange={(e) => setWicketType(e.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
            >
              <option value="">— No wicket —</option>
              {wicketOptions.map((w) => (
                <option key={w} value={w}>{w.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {wicketType && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Player out</label>
              <select
                value={playerOutId}
                onChange={(e) => setPlayerOutId(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
              >
                <option value="">— Select —</option>
                {playerOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {wicketType && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fielder (optional)</label>
              <select
                value={fielderPlayerId}
                onChange={(e) => setFielderPlayerId(e.target.value)}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-200"
              >
                <option value="">— None —</option>
                {playerOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1">Commentary (optional)</label>
            <input
              type="text"
              maxLength={500}
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="e.g. Edged through covers"
              className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>

          {/* Wicket-specific run buttons */}
          {wicketType && (
            <div className="grid grid-cols-4 gap-2">
              {([0, 1, 2, 3] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => submit(r)}
                  disabled={isPending}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 py-2 text-sm font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {r}+W
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shot details toggle — optional, does not block scoring */}
      <div>
        <button
          type="button"
          onClick={() => setShowShotDetails(!showShotDetails)}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          <span>{showShotDetails ? "▼" : "▶"}</span>
          Shot details (optional analytics)
          {(shotType || wagonZone || batContactType) && (
            <span className="ml-1 rounded-full bg-sky-500/20 text-sky-400 px-1.5 py-0.5 text-[10px]">filled</span>
          )}
        </button>

        {showShotDetails && (
          <div className="mt-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-3 space-y-2">
            <p className="text-[10px] text-slate-600 italic">All fields optional. Enables wagon wheel and phase analytics.</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Shot type</label>
                <select
                  value={shotType}
                  onChange={(e) => setShotType(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">—</option>
                  {["drive","cut","pull","hook","sweep","reverse_sweep","glance","flick","loft","defence","leave","nudge"].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Wagon zone</label>
                <select
                  value={wagonZone}
                  onChange={(e) => setWagonZone(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">—</option>
                  {["straight","mid_off","cover","point","third_man","fine_leg","square_leg","mid_wicket","mid_on"].map((z) => (
                    <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Bat contact</label>
                <select
                  value={batContactType}
                  onChange={(e) => setBatContactType(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="">—</option>
                  {["middle","edge","inside_edge","top_edge","missed","pad"].map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Fielder position</label>
                <input
                  type="text"
                  maxLength={50}
                  value={fieldingPositionDetail}
                  onChange={(e) => setFieldingPositionDetail(e.target.value)}
                  placeholder="e.g. mid-on"
                  className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Match controls */}
      <div className="flex gap-2 border-t border-slate-800 pt-3">
        <button
          onClick={onPause}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700 transition-colors"
        >
          Pause
        </button>
        <button
          onClick={onEndInnings}
          className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 hover:bg-orange-500/20 transition-colors"
        >
          End Innings
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {warning && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          {warning}
        </div>
      )}
    </div>
  );
}
