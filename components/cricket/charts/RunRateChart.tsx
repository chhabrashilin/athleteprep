import type { RunRatePoint } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";
import { ChartLegend } from "./ChartLegend";

interface Props {
  points: RunRatePoint[];
  showRequired?: boolean;
}

export function RunRateChart({ points, showRequired = true }: Props) {
  if (points.length === 0) {
    return (
      <ChartEmptyState
        title="No run-rate data"
        message="Run-rate chart requires ball-by-ball scoring data."
      />
    );
  }

  const W = 560;
  const H = 200;
  const PAD = { top: 10, right: 16, bottom: 36, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxBalls = Math.max(...points.map((p) => p.balls), 1);
  const allRates = points.flatMap((p) => [p.currentRunRate ?? 0, showRequired ? (p.requiredRunRate ?? 0) : 0]).filter(Boolean);
  const maxRate = Math.max(...allRates, 12);

  const xScale = (balls: number) => PAD.left + (balls / maxBalls) * chartW;
  const yScale = (rate: number) => PAD.top + chartH - (rate / maxRate) * chartH;

  // Build paths
  const crrPath = points
    .filter((p) => p.currentRunRate !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.balls).toFixed(1)} ${yScale(p.currentRunRate!).toFixed(1)}`)
    .join(" ");

  const rrrPath = showRequired
    ? points
        .filter((p) => p.requiredRunRate !== null && p.requiredRunRate > 0)
        .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.balls).toFixed(1)} ${yScale(p.requiredRunRate!).toFixed(1)}`)
        .join(" ")
    : "";

  const hasRequired = showRequired && rrrPath.length > 0;

  const gridRates = [0, 4, 8, 12].filter((r) => r <= maxRate * 1.1);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Run rate graph showing current and required run rates"
        style={{ maxHeight: 220 }}
      >
        {/* Grid */}
        {gridRates.map((rate) => {
          const y = yScale(rate);
          return (
            <g key={rate}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#64748b">{rate}</text>
            </g>
          );
        })}

        {/* CRR line */}
        {crrPath && (
          <path d={crrPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* RRR dashed line */}
        {hasRequired && (
          <path d={rrrPath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 3" />
        )}

        {/* X-axis labels */}
        {Array.from({ length: Math.floor(maxBalls / 6) + 1 }, (_, i) => {
          const ball = i * 6;
          const x = xScale(ball);
          return (
            <text key={i} x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#64748b">
              {i}
            </text>
          );
        })}
        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="9" fill="#475569">Overs</text>
        <text x={PAD.left - 24} y={H / 2} textAnchor="middle" fontSize="9" fill="#475569" transform={`rotate(-90, ${PAD.left - 24}, ${H / 2})`}>RPO</text>

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#334155" strokeWidth="1" />
      </svg>

      <ChartLegend items={[
        { color: "#38bdf8", label: "Current Run Rate" },
        ...(hasRequired ? [{ color: "#f97316", label: "Required Run Rate", dashed: true }] : []),
      ]} />
    </div>
  );
}
