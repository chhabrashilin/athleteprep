import { Swords } from "lucide-react";
import { OpponentTendencyCard } from "@/components/reports/OpponentTendencyCard";
import type { OpponentTendency } from "@/types/database";

interface OpponentTendenciesSectionProps {
  tendencies: OpponentTendency[];
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function OpponentTendenciesSection({
  tendencies,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: OpponentTendenciesSectionProps) {
  return (
    <section id="opponent" className="space-y-4">
      <div className="flex items-center gap-2">
        <Swords className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Opponent Tendencies
          <span className="ml-2 text-sm font-normal text-slate-500">({tendencies.length})</span>
        </h2>
      </div>

      {tendencies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm text-slate-500 mb-2">No opponent tendencies found.</p>
          <p className="text-xs text-slate-600">
            Add opponent notes or tag key moments with &ldquo;Opponent&rdquo; team context to generate opponent analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tendencies.map((t) => (
            <OpponentTendencyCard
              key={t.id}
              tendency={t}
              teamId={teamId}
              gameId={gameId}
              gameReportId={gameReportId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
