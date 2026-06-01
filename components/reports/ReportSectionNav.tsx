"use client";

import { cn } from "@/lib/utils/cn";

interface NavSection {
  id: string;
  label: string;
  count?: number;
}

interface ReportSectionNavProps {
  sections: NavSection[];
}

export function ReportSectionNav({ sections }: ReportSectionNavProps) {
  return (
    <nav
      aria-label="Report sections"
      className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-950/90 backdrop-blur border-b border-slate-800 mb-8"
    >
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            )}
          >
            {section.label}
            {section.count !== undefined && section.count > 0 && (
              <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500">
                {section.count}
              </span>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
