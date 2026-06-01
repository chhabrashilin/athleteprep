import type { ReactNode } from "react";
import { Zap } from "lucide-react";

/**
 * Minimal shared report layout — no sidebar, no team nav, just branding.
 * Used by all /share/* routes.
 */
export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-100">GameIQ</span>
          </div>
          <span className="text-xs text-slate-500 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1">
            Read-only shared report
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-600">
            Shared through{" "}
            <span className="text-slate-500 font-medium">GameIQ</span> — AI game review for serious teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
