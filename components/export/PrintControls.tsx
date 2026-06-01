"use client";

import Link from "next/link";
import { Printer, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ExportSectionOptions } from "@/types/export";

const SECTION_LABELS: Partial<Record<keyof ExportSectionOptions, string>> = {
  includeOverview: "Overview",
  includeCoachingInsights: "Coaching Insights",
  includePlayerReports: "Player Reports",
  includeOpponentTendencies: "Opponent Tendencies",
  includePracticePlan: "Practice Plan",
  includeEvidence: "Evidence",
  includeAssumptionsLimitations: "Assumptions & Limits",
  includeVerificationStatus: "Verification Status",
};

interface PrintControlsProps {
  reportTitle: string;
  sections: ExportSectionOptions;
  generatedDate: string;
  backHref: string;
}

export function PrintControls({
  reportTitle,
  sections,
  generatedDate,
  backHref,
}: PrintControlsProps) {
  const activeSections = (
    Object.keys(sections) as (keyof ExportSectionOptions)[]
  ).filter((k) => sections[k]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="no-print mb-8 rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 mb-0.5">{reportTitle}</h2>
          <p className="text-xs text-slate-400">
            Export-ready view · Generated{" "}
            {new Date(generatedDate).toLocaleDateString("en-US", { dateStyle: "medium" })} ·
            Exported {new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to report
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Sections summary */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {activeSections.map((k) => (
          <span
            key={k}
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
          >
            {SECTION_LABELS[k] ?? k}
          </span>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2">
        <Info className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          Use your browser&apos;s print dialog and choose{" "}
          <strong className="text-slate-300">Save as PDF</strong> to export a PDF file.
          The controls above are hidden when printing.
        </p>
      </div>
    </div>
  );
}
