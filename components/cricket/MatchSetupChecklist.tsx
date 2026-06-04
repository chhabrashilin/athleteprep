import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { CricketMatchFull, CricketMatchSquad } from "@/lib/cricket/types";

interface ChecklistItem {
  label: string;
  done: boolean;
  description: string;
}

interface MatchSetupChecklistProps {
  match: CricketMatchFull;
  squads: CricketMatchSquad[];
  matchSlug: string;
}

export function MatchSetupChecklist({ match, squads, matchSlug }: MatchSetupChecklistProps) {
  const homeSquad = squads.filter((s) => s.teamId === match.homeTeamId && s.isPlayingXi);
  const awaySquad = squads.filter((s) => s.teamId === match.awayTeamId && s.isPlayingXi);
  const hasCaptains = squads.some((s) => s.isCaptain);

  const items: ChecklistItem[] = [
    {
      label: "Teams confirmed",
      done: !!(match.homeTeamId && match.awayTeamId),
      description: match.homeTeamId && match.awayTeamId
        ? "Home and away teams are assigned"
        : "Match needs home and away teams",
    },
    {
      label: "Playing XI selected",
      done: homeSquad.length >= 1 && awaySquad.length >= 1,
      description: `${homeSquad.length} home / ${awaySquad.length} away players selected`,
    },
    {
      label: "Captain designated",
      done: hasCaptains,
      description: hasCaptains ? "At least one captain is marked" : "Mark a captain in the squad",
    },
    {
      label: "Toss recorded",
      done: !!(match.tossWinnerTeamId && match.tossDecision),
      description: match.tossWinnerTeamId && match.tossDecision
        ? `Toss won — elected to ${match.tossDecision}`
        : "Record toss result below",
    },
    {
      label: "Scorecard ready",
      done: match.scorecardStatus !== "not_started",
      description: `Status: ${match.scorecardStatus.replace("_", " ")}`,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">Setup Checklist</h2>
        <span className="text-xs text-slate-500">{completedCount}/{items.length}</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-xs font-medium ${item.done ? "text-slate-300" : "text-slate-500"}`}>
                {item.label}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {allDone && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <Link
            href={`/cricket/matches/${matchSlug}/scorecard/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
          >
            Open Scorecard Entry
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
