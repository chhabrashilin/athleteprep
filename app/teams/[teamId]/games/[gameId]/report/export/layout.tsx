import type { ReactNode } from "react";
import { Zap } from "lucide-react";

/**
 * Export layout — no sidebar, no team nav, no app shell.
 * Designed for print/PDF output. Controls are hidden via .no-print in print media.
 */
export default function ExportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white print-page">
      {/* Screen-only header bar */}
      <header className="no-print border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">GameIQ</span>
          <span className="ml-auto text-xs text-slate-400 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            Export / Print view
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Print footer — visible only in print */}
      <div className="print-only-footer hidden">
        <p>Generated with GameIQ — AI game review for serious teams.</p>
      </div>
    </div>
  );
}
