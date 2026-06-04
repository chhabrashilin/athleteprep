import type { ManhattanChartBar } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";

const INNINGS_COLORS = ["#38bdf8", "#f97316"];

interface Props {
  bars: ManhattanChartBar[];
  teamNames?: Record<string, string>;
}

export function ManhattanChart({ bars, teamNames = {} }: Props) {
  if (bars.length === 0) {
    return (
      <ChartEmptyState
        title="No Manhattan data"
        message="Manhattan chart requires ball-by-ball scoring data."
      />
    );
  }

  const W = 560;
  const H = 220;
  const PAD = { top: 10, right: 16, bottom: 36, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Group by innings
  const inningsGroups = new Map<string, ManhattanChartBar[]>();
  for (const b of bars) {
    if (!inningsGroups.has(b.inningsId)) inningsGroups.set(b.inningsId, []);
    inningsGroups.get(b.inningsId)!.push(b);
  }
  const inningsArr = Array.from(inningsGroups.entries());

  const totalOvers = Math.max(...bars.map((b) => b.overNumber), 0) + 1;
  const maxRuns = Math.max(...bars.map((b) => b.runs), 1);
  const barGroupW = chartW / totalOvers;
  const barW = Math.max(2, (barGroupW / inningsArr.length) - 2);

  const yScale = (runs: number) => chartH - (runs / maxRuns) * chartH;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Manhattan chart showing runs per over"
        style={{ maxHeight: 240 }}
      >
        {/* Y-axis grid */}
        {[0, Math.ceil(maxRuns / 2), maxRuns].map((v, i) => {
          const y = PAD.top + yScale(v);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{v}</text>
            </g>
          );
        })}

        {/* Bars */}
        {inningsArr.map(([inningsId, inningsBars], inningsIdx) => {
          const color = INNINGS_COLORS[inningsIdx % INNINGS_COLORS.length]!;
          return inningsBars.map((bar) => {
            const x = PAD.left + bar.overNumber * barGroupW + inningsIdx * (barW + 2);
            const barHeight = Math.max(1, (bar.runs / maxRuns) * chartH);
            const y = PAD.top + chartH - barHeight;

            return (
              <g key={`${inningsId}-${bar.overNumber}`}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barHeight}
                  fill={color}
                  opacity={bar.wickets > 0 ? 0.95 : 0.7}
                  rx="1"
                  aria-label={`Over ${bar.overNumber + 1}: ${bar.runs} runs${bar.wickets > 0 ? `, ${bar.wickets}W` : ""}`}
                />
                {/* Wicket dot on top */}
                {bar.wickets > 0 && (
                  <circle cx={x + barW / 2} cy={y - 3} r="2.5" fill="#f43f5e" />
                )}
              </g>
            );
          });
        })}

        {/* X-axis labels (every 5 overs) */}
        {Array.from({ length: Math.ceil(totalOvers / 5) }, (_, i) => {
          const over = i * 5;
          const x = PAD.left + over * barGroupW;
          return (
            <text key={over} x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {over}
            </text>
          );
        })}

        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#475569">Overs</text>

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
      </svg>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        {inningsArr.map(([, ib], i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: INNINGS_COLORS[i % INNINGS_COLORS.length] }} />
            Innings {i + 1}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block bg-rose-500" />
          Wicket
        </span>
      </div>
    </div>
  );
}
