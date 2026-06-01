import { FileDown, AlertCircle } from "lucide-react";
import { ExportStatusBadge } from "./ExportStatusBadge";
import type { ExportRecord } from "@/types/export";

interface ExportHistoryListProps {
  exports: ExportRecord[];
}

const EXPORT_TYPE_LABELS: Record<string, string> = {
  browser_pdf: "Browser PDF",
  print: "Print",
  server_pdf: "Server PDF",
};

export function ExportHistoryList({ exports }: ExportHistoryListProps) {
  if (exports.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic">No export history yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {exports.map((record) => {
        const sections = record.metadata?.sections as Record<string, boolean> | undefined;
        const sectionCount = sections
          ? Object.values(sections).filter(Boolean).length
          : null;

        return (
          <div
            key={record.id}
            className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-300">
                  {EXPORT_TYPE_LABELS[record.exportType] ?? record.exportType}
                </span>
                <ExportStatusBadge status={record.status} />
                {sectionCount !== null && (
                  <span className="text-xs text-slate-500">{sectionCount} sections</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(record.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {record.status === "failed" && record.errorMessage && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{record.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
