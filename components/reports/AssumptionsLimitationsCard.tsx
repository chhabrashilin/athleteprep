import { Info, AlertTriangle } from "lucide-react";
import type { GameReport } from "@/types/database";

interface AssumptionsLimitationsCardProps {
  report: GameReport;
}

export function AssumptionsLimitationsCard({ report }: AssumptionsLimitationsCardProps) {
  const hasAssumptions = report.assumptions.length > 0;
  const hasLimitations = report.limitations.length > 0;

  if (!hasAssumptions && !hasLimitations) return null;

  return (
    <section id="evidence" className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-100">Evidence & Limitations</h2>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {hasAssumptions && (
          <div className="px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-300">Assumptions</h3>
            </div>
            <ul className="space-y-2">
              {report.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-sky-400/60 shrink-0 mt-0.5">·</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasLimitations && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-300">Limitations</h3>
            </div>
            <ul className="space-y-2">
              {report.limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-amber-400/60 shrink-0 mt-0.5">·</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-500">
          GameIQ v1 generates insights from manually entered data only. Automated computer vision
          and player tracking are future roadmap items. All evidence references above point to
          inputs you provided — the AI does not invent facts.
        </p>
      </div>
    </section>
  );
}
