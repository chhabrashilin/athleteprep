import Link from "next/link";
import { CheckCircle2, Circle, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GameSetupStatus } from "@/lib/db/games";

interface GameSetupChecklistProps {
  teamId: string;
  gameId: string;
  setupStatus: GameSetupStatus;
}

interface Step {
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  comingSoon?: boolean;
}

export function GameSetupChecklist({
  teamId,
  gameId,
  setupStatus,
}: GameSetupChecklistProps) {
  const steps: Step[] = [
    {
      label: "Game details",
      description: "Title, sport, game type, opponent, and date entered.",
      completed: setupStatus.hasGameDetails,
      href: setupStatus.hasGameDetails
        ? undefined
        : `/teams/${teamId}/games/${gameId}/edit`,
    },
    {
      label: "Roster",
      description: "At least one active player on the team roster.",
      completed: setupStatus.hasRoster,
      href: setupStatus.hasRoster ? undefined : `/teams/${teamId}/players`,
    },
    {
      label: "Video upload",
      description: "Upload game or practice film for analysis.",
      completed: setupStatus.hasVideo,
      href: setupStatus.hasVideo
        ? undefined
        : `/teams/${teamId}/games/${gameId}#video-section`,
    },
    {
      label: "Key moments",
      description: "Tag timestamps, events, players, and coach notes.",
      completed: setupStatus.hasTimestamps,
      href: setupStatus.hasTimestamps
        ? undefined
        : `/teams/${teamId}/games/${gameId}/timestamps`,
    },
    {
      label: "AI Report",
      description: "Generate coaching insights, player reports, and recommendations.",
      completed: setupStatus.hasReport,
      href: `/teams/${teamId}/games/${gameId}/report`,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Analysis setup</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {steps.length} steps complete
          </p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-5 rounded-full",
                step.completed ? "bg-sky-500" : "bg-slate-700"
              )}
            />
          ))}
        </div>
      </div>

      <ul className="divide-y divide-slate-800/60">
        {steps.map((step, i) => {
          const content = (
            <div className="flex items-start gap-3 px-5 py-4">
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.completed ? "text-slate-400 line-through" : "text-slate-200"
                  )}
                >
                  {i + 1}. {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              </div>
              {step.comingSoon && !step.completed && (
                <span className="shrink-0 flex items-center gap-1 text-xs text-slate-600">
                  <Lock className="h-3 w-3" />
                  Soon
                </span>
              )}
              {!step.comingSoon && step.href && (
                <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              )}
            </div>
          );

          if (step.href) {
            return (
              <li key={i}>
                <Link
                  href={step.href}
                  className="block hover:bg-slate-800/40 transition-colors"
                >
                  {content}
                </Link>
              </li>
            );
          }

          return <li key={i}>{content}</li>;
        })}
      </ul>

      {/* Key moments guidance */}
      {!setupStatus.hasTimestamps && setupStatus.hasVideo && (
        <div className="border-t border-slate-800 px-5 py-3">
          <p className="text-xs text-slate-500">
            💡 5–10 key moments give the AI the best evidence for actionable insights.
          </p>
        </div>
      )}
    </div>
  );
}
