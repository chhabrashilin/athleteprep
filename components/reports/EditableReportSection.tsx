import { PenLine } from "lucide-react";
import { EditedBadge } from "@/components/reports/EditedBadge";
import { VerificationBadge } from "@/components/ui/Badge";
import type { VerificationStatus } from "@/types/core";

interface EditableReportSectionProps {
  isEdited?: boolean;
  verificationStatus?: VerificationStatus;
  canEdit?: boolean;
  onEdit?: () => void;
  editLabel?: string;
}

/**
 * Renders a compact row of status badges + optional edit button.
 * Designed to be placed inside card headers alongside the entity title.
 */
export function EditableReportSection({
  isEdited,
  verificationStatus,
  canEdit,
  onEdit,
  editLabel = "Edit",
}: EditableReportSectionProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 flex-wrap">
      {isEdited && <EditedBadge />}
      {verificationStatus && <VerificationBadge status={verificationStatus} />}
      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
        >
          <PenLine className="h-3 w-3" aria-hidden="true" />
          {editLabel}
        </button>
      )}
    </div>
  );
}
