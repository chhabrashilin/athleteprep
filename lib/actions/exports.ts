"use server";

import { createExportRecord, markExportCompleted, markExportFailed } from "@/lib/db/exports";
import { getServerUser } from "@/lib/supabase/server";
import { trackReportExportOpened } from "@/lib/analytics/track";
import type { CreateExportInput, ExportRecord, ExportSectionOptions } from "@/types/export";

export interface CreateExportActionResult {
  exportRecord: ExportRecord | null;
  error: string | null;
}

/**
 * Creates an export record and immediately marks it completed (browser PDF flow).
 * No file is stored — the record tracks that a browser export was initiated.
 * Storage path remains null for browser-generated PDFs.
 */
export async function createBrowserExportAction(
  input: Omit<CreateExportInput, "exportType">,
  sections: ExportSectionOptions
): Promise<CreateExportActionResult> {
  try {
    const record = await createExportRecord({
      ...input,
      exportType: "browser_pdf",
      metadata: {
        sections,
        exportMode: "browser_pdf",
        note: "Browser-generated PDF — no file stored server-side.",
      },
    });

    await markExportCompleted(record.id, {
      sections,
      exportMode: "browser_pdf",
      completedAt: new Date().toISOString(),
    });

    const user = await getServerUser();
    const sectionCount = Object.values(sections).filter(Boolean).length;
    void trackReportExportOpened(
      user?.id ?? "",
      input.teamId,
      input.gameId,
      input.gameReportId,
      { sectionCount }
    );

    return { exportRecord: { ...record, status: "completed" }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create export record.";
    return { exportRecord: null, error: message };
  }
}

/**
 * Marks an existing export record as failed.
 * Called if the export page fails to load report data.
 */
export async function failExportAction(
  exportId: string,
  errorMessage: string
): Promise<void> {
  try {
    await markExportFailed(exportId, errorMessage);
  } catch {
    // Best-effort — never block the user
  }
}
