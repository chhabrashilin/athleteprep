/**
 * lib/ai/generate-game-report.ts — High-level async report generation entry point.
 *
 * Orchestrates:
 * 1. Provider selection via factory
 * 2. AI generation (real or mock)
 * 3. Output normalization + hallucination guards
 * 4. Returns the validated, normalized result
 *
 * Called from lib/analysis/generate-report.ts (the full pipeline orchestrator).
 * Never called directly from components or pages.
 */
import { getConfiguredAIProvider, getAIProviderConfig } from "./provider-factory";
import { normalizeGeneratedReport } from "@/lib/analysis/normalize-generated-report";
import type { AnalysisInputSnapshot, GeneratedGameReport } from "@/types/analysis";
import type { AIProviderReportResult } from "./types";

export interface GenerateGameReportResult {
  providerResult: AIProviderReportResult;
  normalizedReport: GeneratedGameReport;
  normalizationWarnings: string[];
  providerName: string;
  modelName: string;
}

/**
 * Generates a game report using the configured AI provider.
 * Validates output schema, normalizes IDs, applies hallucination guards.
 */
export async function generateGameReport(
  input: AnalysisInputSnapshot
): Promise<GenerateGameReportResult> {
  const provider = getConfiguredAIProvider();
  const config = getAIProviderConfig();

  const providerResult = await provider.generateGameReport(input);

  const { report: normalizedReport, warnings } = normalizeGeneratedReport(
    providerResult.parsedReport,
    input
  );

  if (warnings.length > 0) {
    console.warn(
      `[AI] ${warnings.length} normalization warning(s) for ${config.provider}/${config.model}:`,
      warnings
    );
  }

  return {
    providerResult,
    normalizedReport,
    normalizationWarnings: warnings,
    providerName: config.provider,
    modelName: config.model,
  };
}
