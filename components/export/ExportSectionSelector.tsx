"use client";

import type { ExportSectionOptions } from "@/types/export";

interface SectionToggleProps {
  id: keyof ExportSectionOptions;
  label: string;
  checked: boolean;
  onChange: (id: keyof ExportSectionOptions, value: boolean) => void;
}

function SectionToggle({ id, label, checked, onChange }: SectionToggleProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(id, e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
      />
      <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
        {label}
      </span>
    </label>
  );
}

const SECTIONS: { id: keyof ExportSectionOptions; label: string }[] = [
  { id: "includeOverview", label: "Overview & Executive Summary" },
  { id: "includeCoachingInsights", label: "Coaching Insights" },
  { id: "includePlayerReports", label: "Player Reports" },
  { id: "includeOpponentTendencies", label: "Opponent Tendencies" },
  { id: "includePracticePlan", label: "Practice Plan" },
  { id: "includeEvidence", label: "Evidence & Key Moments" },
  { id: "includeAssumptionsLimitations", label: "Assumptions & Limitations" },
  { id: "includeVerificationStatus", label: "Verification / Edited Status" },
];

interface ExportSectionSelectorProps {
  value: ExportSectionOptions;
  onChange: (updated: ExportSectionOptions) => void;
}

export function ExportSectionSelector({ value, onChange }: ExportSectionSelectorProps) {
  function handleChange(id: keyof ExportSectionOptions, checked: boolean) {
    onChange({ ...value, [id]: checked });
  }

  return (
    <div className="space-y-2">
      {SECTIONS.map((s) => (
        <SectionToggle
          key={s.id}
          id={s.id}
          label={s.label}
          checked={value[s.id]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
