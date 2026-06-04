import type { PartnershipChartRow } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";
import { ballsToOversText } from "@/lib/cricket/scorecards/calculations";

interface Props {
  partnerships: PartnershipChartRow[];
}

export function PartnershipChart({ partnerships }: Props) {
  if (partnerships.length === 0) {
    return (
      <ChartEmptyState
        title="No partnership data"
        message="Partnership data will appear when innings have ball-by-ball or scorecard data."
      />
    );
  }

  const maxRuns = Math.max(...partnerships.map((p) => p.runs), 1);

  return (
    <div>
      {/* Horizontal bar chart */}
      <div className="space-y-2 mb-4" role="list" aria-label="Partnership chart">
        {partnerships.map((p) => (
          <div key={p.wicketNumber} className="flex items-center gap-3" role="listitem">
            <span className="text-xs text-slate-500 w-6 text-right shrink-0">
              {p.wicketNumber}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-slate-400 truncate">
                  {p.playerOneName} &amp; {p.playerTwoName}
                </span>
              </div>
              <div className="h-4 bg-slate-800 rounded-sm overflow-hidden" aria-label={`${p.runs} runs`}>
                <div
                  className="h-full rounded-sm transition-all bg-sky-500/70"
                  style={{ width: `${(p.runs / maxRuns) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-slate-200">{p.runs}</span>
              <span className="text-xs text-slate-500 ml-1">({ballsToOversText(p.balls)})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-1 pr-2">Wkt</th>
              <th className="text-left pb-1 pr-2">Partnership</th>
              <th className="text-right pb-1 pr-2">Runs</th>
              <th className="text-right pb-1 pr-2">Balls</th>
              <th className="text-right pb-1">RR</th>
            </tr>
          </thead>
          <tbody>
            {partnerships.map((p) => (
              <tr key={p.wicketNumber} className="text-slate-300 border-b border-slate-800/40">
                <td className="py-1 pr-2 text-slate-500">{p.wicketNumber}</td>
                <td className="py-1 pr-2 truncate max-w-[140px]">
                  {p.playerOneName} & {p.playerTwoName}
                </td>
                <td className="py-1 pr-2 text-right font-medium">{p.runs}</td>
                <td className="py-1 pr-2 text-right">{p.balls}</td>
                <td className="py-1 text-right">{p.runRate?.toFixed(2) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
