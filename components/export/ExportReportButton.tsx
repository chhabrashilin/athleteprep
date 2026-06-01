"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExportReportModal } from "./ExportReportModal";
import type { ExportRecord } from "@/types/export";

interface ExportReportButtonProps {
  teamId: string;
  gameId: string;
  gameReportId: string;
  reportTitle: string;
  initialExports: ExportRecord[];
}

export function ExportReportButton({
  teamId,
  gameId,
  gameReportId,
  reportTitle,
  initialExports,
}: ExportReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>

      {open && (
        <ExportReportModal
          teamId={teamId}
          gameId={gameId}
          gameReportId={gameReportId}
          reportTitle={reportTitle}
          initialExports={initialExports}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
