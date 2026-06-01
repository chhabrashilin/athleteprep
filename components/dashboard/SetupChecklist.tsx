import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChecklistItem {
  label: string;
  description: string;
  completed: boolean;
  href?: string;
}

interface SetupChecklistProps {
  hasTeam: boolean;
  hasPlayers?: boolean;
  hasGames?: boolean;
  firstTeamId?: string;
}

export function SetupChecklist({ hasTeam, hasPlayers = false, hasGames = false, firstTeamId }: SetupChecklistProps) {
  const items: ChecklistItem[] = [
    {
      label: "Create team workspace",
      description: "Set up your team and become the owner.",
      completed: hasTeam,
      href: hasTeam ? undefined : "/teams/new",
    },
    {
      label: "Add roster",
      description: "Add players so they can be tagged in AI reports.",
      completed: hasPlayers,
      href: hasTeam && !hasPlayers && firstTeamId
        ? `/teams/${firstTeamId}/players/new`
        : hasTeam && firstTeamId
        ? `/teams/${firstTeamId}/players`
        : undefined,
    },
    {
      label: "Create a game",
      description: "Log a match or practice session for review.",
      completed: hasGames,
      href: hasTeam && !hasGames && firstTeamId
        ? `/teams/${firstTeamId}/games/new`
        : hasTeam && firstTeamId
        ? `/teams/${firstTeamId}/games`
        : undefined,
    },
    {
      label: "Upload game film",
      description: "Attach video so the AI can reference timestamps.",
      completed: false,
      href: hasGames && firstTeamId
        ? `/teams/${firstTeamId}/games`
        : undefined,
    },
    {
      label: "Tag key moments",
      description: "Add 5–10 timestamps to build evidence for AI insights.",
      completed: false,
      href: hasGames && firstTeamId
        ? `/teams/${firstTeamId}/games`
        : undefined,
    },
    {
      label: "Generate AI report",
      description: "Get coaching insights, player reports, and recommendations.",
      completed: false,
      href: hasGames && firstTeamId
        ? `/teams/${firstTeamId}/games`
        : undefined,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Setup checklist</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {items.length} steps complete
          </p>
        </div>
        <div className="flex items-center gap-1">
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-5 rounded-full",
                item.completed ? "bg-sky-500" : "bg-slate-700"
              )}
            />
          ))}
        </div>
      </div>

      <ul className="divide-y divide-slate-800/60">
        {items.map((item, i) => {
          const content = (
            <div className="flex items-start gap-3 px-5 py-4">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    item.completed ? "text-slate-400 line-through" : "text-slate-200"
                  )}
                >
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
              </div>
              {!item.completed && item.href && (
                <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              )}
            </div>
          );

          if (!item.completed && item.href) {
            return (
              <li key={i}>
                <Link
                  href={item.href}
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
    </div>
  );
}
