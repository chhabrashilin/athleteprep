/**
 * lib/ai/providers.ts — AI provider configuration and generation entry point.
 *
 * The primary async path is now lib/ai/generate-game-report.ts +
 * lib/ai/provider-factory.ts. This file re-exports the config accessor and
 * keeps a synchronous mock-only wrapper for any legacy call sites.
 */
import type { AIServiceConfig } from "./types";
import type { AnalysisInputSnapshot, GeneratedGameReport } from "@/types/analysis";
import { generateMockGameReport } from "./mock-ai";
import { getAIConfig } from "./provider-factory";

// Re-export config accessor
export { getAIConfig };

// Re-export factory for pipeline use
export { getConfiguredAIProvider, getAIProviderConfig } from "./provider-factory";

/**
 * Synchronous mock-only generator kept for backward compatibility.
 * New code should use generateGameReport() from lib/ai/generate-game-report.ts.
 *
 * This always uses the mock provider regardless of config — only call it
 * when you explicitly want mock output (e.g., tests, fallback in non-async contexts).
 */
export function generateReport(
  input: AnalysisInputSnapshot,
  config?: Partial<AIServiceConfig>
): GeneratedGameReport {
  const _ = config; // config param kept for API compat, unused in mock
  return generateMockGameReport(input);
}
