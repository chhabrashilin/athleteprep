import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { CricketLeagueFull, CricketLeagueSettings } from "@/lib/cricket/types";

interface SetupCheckItem {
  label: string;
  done: boolean;
  note?: string;
}

interface LeagueSetupChecklistProps {
  league: CricketLeagueFull;
  settings: CricketLeagueSettings | null;
  memberCount: number;
}

export function LeagueSetupChecklist({
  league,
  settings,
  memberCount,
}: LeagueSetupChecklistProps) {
  const items: SetupCheckItem[] = [
    {
      label: "League info completed",
      done: !!(league.name && league.seasonName && league.format),
      note: "Name, season, and format are required.",
    },
    {
      label: "League settings created",
      done: !!settings,
      note: "Match rules and scoring configuration.",
    },
    {
      label: "Owner assigned",
      done: !!league.createdBy,
      note: "League owner is the account that created the league.",
    },
    {
      label: "Admin or manager added",
      done: memberCount > 1,
      note: "Optional — invite co-admins or managers below.",
    },
    {
      label: "Team registration configured",
      done: false,
      note: "Coming in Prompt 30 — Team Registration.",
    },
    {
      label: "Schedule configured",
      done: false,
      note: "Coming in a future prompt — Match Scheduling.",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            Setup progress
          </span>
          <span className="text-sm text-slate-500">
            {completedCount}/{totalCount} complete
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-3 rounded-lg border border-slate-800 px-4 py-3"
          >
            <div className="mt-0.5 shrink-0">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : item.note?.startsWith("Coming") ? (
                <Clock className="h-4 w-4 text-slate-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  item.done ? "text-slate-200" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
              {item.note && (
                <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
