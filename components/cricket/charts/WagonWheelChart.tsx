import type { WagonWheelData, WagonZone } from "@/lib/cricket/types";
import { ChartEmptyState } from "./ChartEmptyState";
import { WAGON_ZONE_LABELS } from "@/lib/cricket/analytics/chart-data";

interface Props {
  data: WagonWheelData;
  title?: string;
}

// Angle ranges for each zone (center angle in degrees, clockwise from top)
const ZONE_ANGLES: Record<WagonZone, { center: number; span: number }> = {
  straight:   { center: 0,   span: 40 },
  mid_off:    { center: 50,  span: 40 },
  cover:      { center: 90,  span: 40 },
  point:      { center: 130, span: 40 },
  third_man:  { center: 160, span: 40 },
  fine_leg:   { center: 200, span: 40 },
  square_leg: { center: 250, span: 40 },
  mid_wicket: { center: 300, span: 40 },
  mid_on:     { center: 340, span: 40 },
  unknown:    { center: 0,   span: 0  },
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`;
}

const ZONE_COLORS: Record<string, string> = {
  most:   "#38bdf8",
  high:   "#7dd3fc",
  medium: "#475569",
  low:    "#1e293b",
};

function zoneColor(runs: number, maxRuns: number): string {
  const ratio = maxRuns > 0 ? runs / maxRuns : 0;
  if (ratio >= 0.7) return ZONE_COLORS.most!;
  if (ratio >= 0.4) return ZONE_COLORS.high!;
  if (ratio >= 0.1) return ZONE_COLORS.medium!;
  return ZONE_COLORS.low!;
}

export function WagonWheelChart({ data, title = "Wagon Wheel" }: Props) {
  if (!data || data.zones.length === 0) {
    return (
      <ChartEmptyState
        title={title}
        message={data?.reason ?? "No shot data available."}
        hint={data?.totalBalls ? `${data.totalBalls} balls tracked, but no zone data recorded.` : undefined}
      />
    );
  }

  const CX = 150;
  const CY = 150;
  const OUTER_R = 120;
  const INNER_R = 25;

  const maxRuns = Math.max(...data.zones.map((z) => z.runs), 1);

  const zoneMap = new Map(data.zones.map((z) => [z.zoneName, z]));

  const knownZones: WagonZone[] = [
    "straight", "mid_off", "cover", "point", "third_man",
    "fine_leg", "square_leg", "mid_wicket", "mid_on",
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* SVG field */}
      <div className="shrink-0">
        <svg
          viewBox="0 0 300 300"
          width="220"
          height="220"
          role="img"
          aria-label="Wagon wheel showing shot zones"
        >
          {/* Outer boundary */}
          <circle cx={CX} cy={CY} r={OUTER_R} fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          {/* 30-yard circle */}
          <circle cx={CX} cy={CY} r={OUTER_R * 0.5} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          {/* Pitch */}
          <rect x={CX - 5} y={CY - 22} width="10" height="44" fill="#292524" rx="1" />

          {/* Zone wedges */}
          {knownZones.map((zoneName) => {
            const angles = ZONE_ANGLES[zoneName];
            if (!angles || angles.span === 0) return null;
            const zoneData = zoneMap.get(zoneName);
            const runs = zoneData?.runs ?? 0;
            const color = zoneColor(runs, maxRuns);
            const start = angles.center - angles.span / 2;
            const end = angles.center + angles.span / 2;
            const d = describeArc(CX, CY, OUTER_R - 2, start, end);
            const labelPos = polarToCartesian(CX, CY, OUTER_R * 0.75, angles.center);

            return (
              <g key={zoneName}>
                <path d={d} fill={color} opacity="0.8" />
                {runs > 0 && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fill="white"
                    fontWeight="bold"
                  >
                    {runs}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center pitch overlay */}
          <circle cx={CX} cy={CY} r={INNER_R} fill="#0f172a" stroke="#1e293b" strokeWidth="1" />

          {/* Stumps */}
          {[-4, 0, 4].map((offset) => (
            <line key={offset} x1={CX + offset} y1={CY - 8} x2={CX + offset} y2={CY + 8} stroke="#78716c" strokeWidth="1.5" />
          ))}
          <line x1={CX - 5} y1={CY - 8} x2={CX + 5} y2={CY - 8} stroke="#78716c" strokeWidth="1" />
          <line x1={CX - 5} y1={CY + 8} x2={CX + 5} y2={CY + 8} stroke="#78716c" strokeWidth="1" />
        </svg>
        {!data.hasShotCoordinates && (
          <p className="text-[10px] text-slate-500 mt-1 text-center max-w-[220px]">
            Zone summary (no x/y coordinates)
          </p>
        )}
      </div>

      {/* Zone breakdown table */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 mb-2">Zone Breakdown</p>
        <table className="text-xs w-full">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-1 pr-2">Zone</th>
              <th className="text-right pb-1 pr-2">Balls</th>
              <th className="text-right pb-1 pr-2">Runs</th>
              <th className="text-right pb-1">%</th>
            </tr>
          </thead>
          <tbody>
            {data.zones.map((z) => (
              <tr key={z.zoneName} className="text-slate-300 border-b border-slate-800/30">
                <td className="py-0.5 pr-2">{WAGON_ZONE_LABELS[z.zoneName]}</td>
                <td className="py-0.5 pr-2 text-right">{z.balls}</td>
                <td className="py-0.5 pr-2 text-right font-medium">{z.runs}</td>
                <td className="py-0.5 text-right text-slate-400">{z.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-500 mt-2">
          Total: {data.totalRuns} runs off {data.totalBalls} balls
        </p>
      </div>
    </div>
  );
}
