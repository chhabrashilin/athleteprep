import { Clock, Zap, Users, Tag } from "lucide-react";
import type { EventTimestamp } from "@/types/database";

interface EventTimestampStatsProps {
  events: EventTimestamp[];
}

export function EventTimestampStats({ events }: EventTimestampStatsProps) {
  const total = events.length;

  const criticalOrHigh = events.filter(
    (e) => e.importance === "critical" || e.importance === "high"
  ).length;

  const uniquePlayers = new Set(events.flatMap((e) => e.playerIds)).size;

  const uniqueEventTypes = new Set(
    events.map((e) => e.eventType).filter((t): t is string => !!t)
  ).size;

  const stats = [
    {
      icon: <Clock className="h-4 w-4 text-sky-400" />,
      value: total,
      label: "Total events",
    },
    {
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      value: criticalOrHigh,
      label: "High impact",
    },
    {
      icon: <Users className="h-4 w-4 text-emerald-400" />,
      value: uniquePlayers,
      label: "Players tagged",
    },
    {
      icon: <Tag className="h-4 w-4 text-violet-400" />,
      value: uniqueEventTypes,
      label: "Event types",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center"
        >
          <div className="flex justify-center mb-1">{stat.icon}</div>
          <p className="text-lg font-bold text-slate-100">{stat.value}</p>
          <p className="text-xs text-slate-500 leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
