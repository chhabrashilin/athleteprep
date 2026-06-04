import type { PhaseSummaryRow } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";

interface Props {
  phases: PhaseSummaryRow[];
}

export function PhaseSummaryCards({ phases }: Props) {
  const nonEmpty = phases.filter((p) => p.balls > 0);

  if (nonEmpty.length === 0) {
    return (
      <ChartEmptyState
        title="No phase data"
        message="Phase summary requires ball-by-ball data."
      />
    );
  }

  const bestRunRate = nonEmpty.reduce<PhaseSummaryRow | null>(
    (best, p) => (!best || (p.runRate ?? 0) > (best.runRate ?? 0) ? p : best),
    null
  );

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {nonEmpty.map((phase) => (
          <div
            key={phase.phase}
            className={`rounded-xl border px-4 py-3 ${
              phase.phase === bestRunRate?.phase
                ? "border-sky-500/40 bg-sky-500/5"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            <p className="text-xs font-semibold text-slate-400 mb-2">{phase.label}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div>
                <span className="text-slate-500">Runs</span>
                <p className="text-sm font-bold text-slate-200">{phase.runs}/{phase.wickets}W</p>
              </div>
              <div>
                <span className="text-slate-500">Run Rate</span>
                <p className="text-sm font-bold text-slate-200">{phase.runRate?.toFixed(2) ?? "—"}</p>
              </div>
              <div>
                <span className="text-slate-500">Boundaries</span>
                <p className="font-medium text-slate-300">{phase.boundaries}</p>
              </div>
              <div>
                <span className="text-slate-500">Dot %</span>
                <p className="font-medium text-slate-300">{phase.dotBallPercentage ?? "—"}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
