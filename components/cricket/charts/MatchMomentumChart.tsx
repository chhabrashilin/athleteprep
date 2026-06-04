import type { MomentumPoint } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";
import { ChartLegend } from "./ChartLegend";

interface Props {
  points: MomentumPoint[];
  battingTeamName?: string;
  bowlingTeamName?: string;
}

export function MatchMomentumChart({ points, battingTeamName = "Batting", bowlingTeamName = "Bowling" }: Props) {
  if (points.length === 0) {
    return (
      <ChartEmptyState
        title="No momentum data"
        message="Match momentum requires ball-by-ball scoring data."
      />
    );
  }

  const W = 560;
  const H = 200;
  const PAD = { top: 10, right: 16, bottom: 36, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - (v / 100) * chartH;

  const battingPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.battingTeamMomentum).toFixed(1)}`)
    .join(" ");

  const bowlingPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.bowlingTeamMomentum).toFixed(1)}`)
    .join(" ");

  // Mid line at 50
  const midY = yScale(50);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Match momentum chart (experimental)"
        style={{ maxHeight: 220 }}
      >
        {/* Grid: 25, 50, 75 */}
        {[25, 50, 75].map((v) => {
          const y = yScale(v);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={v === 50 ? "#334155" : "#1e293b"} strokeWidth={v === 50 ? "1.5" : "1"} strokeDasharray={v !== 50 ? "3 3" : undefined} />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{v}</text>
            </g>
          );
        })}

        {/* Batting area fill */}
        <path
          d={`${battingPath} L ${xScale(points.length - 1)} ${yScale(50)} L ${xScale(0)} ${yScale(50)} Z`}
          fill="#38bdf8"
          opacity="0.08"
        />

        {/* Lines */}
        <path d={battingPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
        <path d={bowlingPath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 3" />

        {/* X-axis: over labels */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 8)) === 0).map((p) => {
          const i = points.indexOf(p);
          return (
            <text key={i} x={xScale(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {p.overNumber}
            </text>
          );
        })}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#475569">Over</text>

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
      </svg>

      <ChartLegend items={[
        { color: "#38bdf8", label: `${battingTeamName} momentum` },
        { color: "#a78bfa", label: `${bowlingTeamName} momentum`, dashed: true },
      ]} />

      <p className="mt-2 text-[10px] text-slate-500 italic">
        Momentum is an experimental model based on runs, wickets, boundaries, and dot balls per over. It does not reflect official statistics.
      </p>
    </div>
  );
}
