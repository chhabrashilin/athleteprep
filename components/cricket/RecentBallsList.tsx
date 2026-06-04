"use client";

import { buildEventNotation } from "@/lib/cricket/live-scoring/calculations";
import type { CricketBallEvent } from "@/lib/cricket/live-scoring/queries";

interface Props {
  events: CricketBallEvent[];
  onCorrect?: (event: CricketBallEvent) => void;
  canCorrect?: boolean;
}

function ballColor(event: CricketBallEvent): string {
  if (event.isWicket) return "bg-red-500/20 border-red-500/40 text-red-300";
  if (event.isBoundarySix) return "bg-purple-500/20 border-purple-500/40 text-purple-300";
  if (event.isBoundaryFour) return "bg-sky-500/20 border-sky-500/40 text-sky-300";
  if (event.extraType === "wide" || event.extraType === "no_ball") return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
  if (event.isDotBall) return "bg-slate-800 border-slate-700 text-slate-400";
  return "bg-slate-800 border-slate-700 text-slate-200";
}

export function RecentBallsList({ events, onCorrect, canCorrect }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Balls</p>
        <p className="text-sm text-slate-600">No balls scored yet.</p>
      </div>
    );
  }

  // Group by over
  const byOver: Map<number, CricketBallEvent[]> = new Map();
  for (const e of events) {
    const ov = e.overNumber;
    if (!byOver.has(ov)) byOver.set(ov, []);
    byOver.get(ov)!.push(e);
  }

  const overKeys = Array.from(byOver.keys()).sort((a, b) => b - a);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Balls</p>

      <div className="space-y-4">
        {overKeys.map((ov) => {
          const ovEvents = byOver.get(ov)!;
          return (
            <div key={ov}>
              <p className="text-xs text-slate-500 mb-1.5">Over {ov + 1}</p>
              <div className="flex flex-wrap gap-1.5">
                {ovEvents.map((e) => {
                  const notation = buildEventNotation({
                    runsBatter: e.runsBatter,
                    runsExtras: e.runsExtras,
                    extraType: e.extraType as Parameters<typeof buildEventNotation>[0]["extraType"],
                    wicketType: e.wicketType as Parameters<typeof buildEventNotation>[0]["wicketType"],
                    isBoundaryFour: e.isBoundaryFour,
                    isBoundarySix: e.isBoundarySix,
                  });
                  return (
                    <div key={e.id} className="relative group">
                      <div
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border text-xs font-bold ${ballColor(e)}`}
                        title={e.commentary ?? notation}
                      >
                        {notation}
                      </div>
                      {canCorrect && onCorrect && (
                        <button
                          onClick={() => onCorrect(e)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-slate-700 border border-slate-600 text-slate-300 text-xs hover:bg-slate-600"
                          title="Correct this ball"
                          aria-label="Correct this ball"
                        >
                          ✎
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Commentary feed */}
      <div className="mt-4 border-t border-slate-800 pt-3 space-y-1 max-h-40 overflow-y-auto">
        {[...events].reverse().slice(0, 8).map((e) => (
          <p key={e.id} className="text-xs text-slate-400 leading-snug">
            {e.commentary ?? `${e.overNumber}.${e.ballInOver} — ${e.runsTotal} run${e.runsTotal !== 1 ? "s" : ""}`}
          </p>
        ))}
      </div>
    </div>
  );
}
