import type { ExportStatus } from "@/types/export";

interface ExportStatusBadgeProps {
  status: ExportStatus;
}

const CONFIG: Record<ExportStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-slate-700 text-slate-300" },
  processing: { label: "Processing", classes: "bg-amber-500/20 text-amber-400" },
  completed: { label: "Completed", classes: "bg-emerald-500/20 text-emerald-400" },
  failed: { label: "Failed", classes: "bg-red-500/20 text-red-400" },
};

export function ExportStatusBadge({ status }: ExportStatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
