import type { ExportStatus } from "./core";

export type { ExportStatus };

export type ExportType = "browser_pdf" | "print" | "server_pdf";

export interface ExportRecord {
  id: string;
  teamId: string;
  gameId: string | null;
  gameReportId: string | null;
  requestedBy: string | null;
  exportType: ExportType | string;
  status: ExportStatus;
  storageBucket: string | null;
  storagePath: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExportInput {
  teamId: string;
  gameId: string;
  gameReportId: string;
  exportType: ExportType;
  metadata?: Record<string, unknown>;
}

export interface ExportSectionOptions {
  includeOverview: boolean;
  includeCoachingInsights: boolean;
  includePlayerReports: boolean;
  includeOpponentTendencies: boolean;
  includePracticePlan: boolean;
  includeEvidence: boolean;
  includeAssumptionsLimitations: boolean;
  includeVerificationStatus: boolean;
}

export const DEFAULT_EXPORT_SECTIONS: ExportSectionOptions = {
  includeOverview: true,
  includeCoachingInsights: true,
  includePlayerReports: true,
  includeOpponentTendencies: true,
  includePracticePlan: true,
  includeEvidence: true,
  includeAssumptionsLimitations: true,
  includeVerificationStatus: true,
};
