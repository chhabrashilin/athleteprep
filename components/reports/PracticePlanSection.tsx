import { Target } from "lucide-react";
import { PracticeRecommendationCard } from "@/components/reports/PracticeRecommendationCard";
import type { PracticeRecommendation, Player } from "@/types/database";

interface PracticePlanSectionProps {
  recommendations: PracticeRecommendation[];
  players: Player[];
  teamId: string;
  gameId: string;
  gameReportId: string;
  canEdit: boolean;
}

export function PracticePlanSection({
  recommendations,
  players,
  teamId,
  gameId,
  gameReportId,
  canEdit,
}: PracticePlanSectionProps) {
  return (
    <section id="practice" className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Next Practice Plan
          <span className="ml-2 text-sm font-normal text-slate-500">({recommendations.length})</span>
        </h2>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">No practice recommendations in this report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <PracticeRecommendationCard
              key={rec.id}
              recommendation={rec}
              players={players}
              rank={i + 1}
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
