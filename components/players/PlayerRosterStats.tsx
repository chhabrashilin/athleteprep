import type { Player } from "@/types/database";

interface PlayerRosterStatsProps {
  players: Player[];
}

export function PlayerRosterStats({ players }: PlayerRosterStatsProps) {
  const active = players.filter((p) => p.status === "active").length;
  const positions = new Set(
    players.filter((p) => p.position).map((p) => p.position as string)
  ).size;
  const missingNumber = players.filter(
    (p) => !p.jerseyNumber && p.status === "active"
  ).length;

  const stats = [
    {
      label: "Total players",
      value: players.length,
      description: "on this roster",
    },
    {
      label: "Active",
      value: active,
      description: "players available",
    },
    {
      label: "Positions",
      value: positions,
      description: positions === 1 ? "position tracked" : "positions tracked",
    },
    {
      label: "Missing #",
      value: missingNumber,
      description: "without jersey numbers",
      warn: missingNumber > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
        >
          <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
          <p
            className={`text-2xl font-bold ${
              stat.warn && stat.value > 0 ? "text-amber-400" : "text-slate-100"
            }`}
          >
            {stat.value}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
