import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Users, Plus, Film, BarChart3, Zap } from "lucide-react";

export function TeamEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-8 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20">
        <Users className="h-7 w-7 text-sky-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-100 mb-2">
        No teams yet
      </h3>
      <p className="max-w-sm text-sm text-slate-400 mb-8">
        Create your first team workspace to start uploading game film, building
        your roster, and generating AI-powered coaching reports.
      </p>

      {/* Value preview */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-sm">
        {[
          { icon: Film, label: "Game film" },
          { icon: BarChart3, label: "AI reports" },
          { icon: Zap, label: "Insights" },
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

      <Link href="/teams/new">
        <Button size="md">
          <Plus className="h-4 w-4" />
          Create your first team
        </Button>
      </Link>
    </div>
  );
}
