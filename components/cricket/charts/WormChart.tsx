import type { WormChartPoint } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";
import { ChartLegend } from "./ChartLegend";

const INNINGS_COLORS = ["#38bdf8", "#f97316"]; // sky-400, orange-400

interface Props {
  points: WormChartPoint[];
  teamNames?: Record<string, string>;
}

export function WormChart({ points, teamNames = {} }: Props) {
  if (points.length === 0) {
    return (
      <ChartEmptyState
        title="No worm data"
        message="Worm chart requires ball-by-ball scoring data."
        hint="Score a match using the live scoring tool to generate this chart."
      />
    );
  }

  const W = 560;
  const H = 240;
  const PAD = { top: 10, right: 16, bottom: 36, left: 44 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Group by inningsId and preserve insertion order (innings 1 first)
  const inningsGroups = new Map<string, WormChartPoint[]>();
  for (const p of points) {
    if (!inningsGroups.has(p.inningsId)) inningsGroups.set(p.inningsId, []);
    inningsGroups.get(p.inningsId)!.push(p);
  }

  const inningsArr = Array.from(inningsGroups.entries());
  const maxBalls = Math.max(...points.map((p) => p.ballNumber), 1);
  const maxRuns = Math.max(...points.map((p) => p.cumulativeRuns), 1);

  const xScale = (ball: number) => PAD.left + (ball / maxBalls) * chartW;
  const yScale = (runs: number) => PAD.top + chartH - (runs / maxRuns) * chartH;

  const gridLines = 5;
  const gridStep = Math.ceil(maxRuns / gridLines / 10) * 10;

  const legendItems = inningsArr.map(([inningsId], i) => ({
    color: INNINGS_COLORS[i % INNINGS_COLORS.length]!,
    label: teamNames[inningsArr[i]?.[1]?.[0]?.teamId ?? ""] ?? `Innings ${i + 1}`,
  }));

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Worm chart showing cumulative run progression per innings"
        style={{ maxHeight: 260 }}
      >
        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const runVal = i * gridStep;
          if (runVal > maxRuns * 1.1) return null;
          const y = yScale(runVal);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{runVal}</text>
            </g>
          );
        })}

        {/* Over axis labels */}
        {Array.from({ length: Math.floor(maxBalls / 6) + 1 }, (_, i) => {
          const ball = i * 6;
          const x = xScale(ball);
          return (
            <text key={i} x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {i}
            </text>
          );
        })}

        {/* Overs label */}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#475569">Overs</text>

        {/* Lines per innings */}
        {inningsArr.map(([inningsId, inningsPoints], i) => {
          const color = INNINGS_COLORS[i % INNINGS_COLORS.length]!;
          const sorted = [...inningsPoints].sort((a, b) => a.ballNumber - b.ballNumber);
          if (sorted.length < 2) return null;
          const pathD = sorted
            .map((p, j) => `${j === 0 ? "M" : "L"} ${xScale(p.ballNumber).toFixed(1)} ${yScale(p.cumulativeRuns).toFixed(1)}`)
            .join(" ");

          // Wicket markers
          const wicketPoints = sorted.filter((p, j) => j > 0 && p.wickets > (sorted[j - 1]?.wickets ?? 0));

          return (
            <g key={inningsId}>
              <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              {wicketPoints.map((p, j) => (
                <circle key={j} cx={xScale(p.ballNumber)} cy={yScale(p.cumulativeRuns)} r="3" fill={color} opacity="0.8" />
              ))}
            </g>
          );
        })}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
      </svg>

      <ChartLegend items={legendItems} />

      {/* Accessible summary table */}
      <details className="mt-3">
        <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400">View data table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left pr-3 pb-1">Innings</th>
                <th className="text-right pr-3 pb-1">Overs</th>
                <th className="text-right pb-1">Runs</th>
              </tr>
            </thead>
            <tbody>
              {inningsArr.map(([inningsId, inningsPoints], i) => {
                const last = inningsPoints.at(-1);
                return (
                  <tr key={inningsId} className="text-slate-300">
                    <td className="pr-3 py-0.5">Innings {i + 1}</td>
                    <td className="text-right pr-3 py-0.5">{last?.overText ?? "—"}</td>
                    <td className="text-right py-0.5">{last?.cumulativeRuns ?? 0}/{last?.wickets ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
