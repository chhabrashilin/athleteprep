import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Users, Plus, BarChart3, Zap } from "lucide-react";

interface PlayerEmptyStateProps {
  teamId: string;
  canEdit: boolean;
}

export function PlayerEmptyState({ teamId, canEdit }: PlayerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20">
        <Users className="h-7 w-7 text-sky-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        No players on the roster
      </h3>
      <p className="max-w-sm text-sm text-slate-400 mb-8">
        Add your roster so GameIQ can connect timestamps, insights, and
        player-specific feedback to the right athletes.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs">
        {[
          { icon: Users, label: "Player reports" },
          { icon: BarChart3, label: "Linked insights" },
          { icon: Zap, label: "AI feedback" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-800/60 py-3 px-2"
          >
            <Icon className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {canEdit ? (
        <Link href={`/teams/${teamId}/players/new`}>
          <Button size="md">
            <Plus className="h-4 w-4" />
            Add your first player
          </Button>
        </Link>
      ) : (
        <p className="text-sm text-slate-500">
          Contact your team owner or coach to add players.
        </p>
      )}
    </div>
  );
}
