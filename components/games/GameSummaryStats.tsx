import type { Game } from "@/types/database";

interface GameSummaryStatsProps {
  games: Game[];
}

export function GameSummaryStats({ games }: GameSummaryStatsProps) {
  const total    = games.length;
  const draft    = games.filter((g) => g.status === "draft" || g.status === "ready_for_analysis").length;
  const analyzed = games.filter((g) => g.status === "analyzed").length;

  // Most recent game with a date
  const mostRecent = games
    .filter((g) => g.gameDate)
    .sort((a, b) => (b.gameDate ?? "").localeCompare(a.gameDate ?? ""))[0];

  const stats = [
    {
      label: "Total analyses",
      value: total,
      description: "game & practice records",
    },
    {
      label: "In progress",
      value: draft,
      description: draft === 1 ? "draft analysis" : "draft analyses",
    },
    {
      label: "Completed",
      value: analyzed,
      description: analyzed === 1 ? "analyzed game" : "analyzed games",
    },
    {
      label: "Last game",
      value: mostRecent
        ? new Date(mostRecent.gameDate!).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "—",
      description: mostRecent?.title ?? "no games with a date yet",
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
          <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
          <p className="text-xs text-slate-600 mt-0.5 truncate">{stat.description}</p>
        </div>
      ))}
    </div>
  );
}
