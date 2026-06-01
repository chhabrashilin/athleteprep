"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExportSectionSelector } from "./ExportSectionSelector";
import { ExportHistoryList } from "./ExportHistoryList";
import { createBrowserExportAction } from "@/lib/actions/exports";
import { DEFAULT_EXPORT_SECTIONS } from "@/types/export";
import type { ExportSectionOptions, ExportRecord } from "@/types/export";

interface ExportReportModalProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  reportTitle: string;
  initialExports: ExportRecord[];
  onClose: () => void;
}

export function ExportReportModal({
  teamId,
  gameId,
  gameReportId,
  reportTitle,
  initialExports,
  onClose,
}: ExportReportModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sections, setSections] = useState<ExportSectionOptions>(DEFAULT_EXPORT_SECTIONS);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    startTransition(async () => {
      const params = new URLSearchParams({
        sections: JSON.stringify(sections),
      });
      const exportUrl = `/teams/${teamId}/games/${gameId}/report/export?${params.toString()}`;

      // Create the export record (best-effort — don't block navigation on failure)
      const result = await createBrowserExportAction(
        { teamId, gameId, gameReportId },
        sections
      );

      if (result.error) {
        // Show warning but still navigate — export tracking failure must not block printing
        setError(`Note: export record could not be saved (${result.error}). You can still print.`);
      }

      router.push(exportUrl);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Export Report</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{reportTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Explanation */}
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              Opens a clean print-ready version of this report. Use your browser&apos;s
              print dialog to <strong className="text-slate-100">save as PDF</strong> or
              print directly.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-amber-400">{error}</p>
            </div>
          )}

          {/* Section selector */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Sections to include
            </p>
            <ExportSectionSelector value={sections} onChange={setSections} />
          </div>

          {/* Export history */}
          {initialExports.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Export history
              </p>
              <ExportHistoryList exports={initialExports.slice(0, 5)} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpen}
            disabled={isPending}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isPending ? "Opening…" : "Open Export View"}
          </Button>
        </div>
      </div>
    </div>
  );
}
