/**
 * Gemini provider stub for GameIQ report generation.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install the Google Generative AI SDK:
 *    npm install @google/generative-ai
 * 2. Set in .env.local:
 *    AI_PROVIDER=gemini
 *    GEMINI_API_KEY=AI...
 *    GEMINI_MODEL=gemini-1.5-flash   (or gemini-1.5-pro)
 *    NEXT_PUBLIC_ENABLE_REAL_AI=true
 * 3. Replace this stub with a real implementation following the same pattern
 *    as openai-provider.ts. Use generateContent() with responseMimeType: "application/json"
 *    for structured JSON output.
 *
 * This stub throws a clear error rather than failing silently.
 */
import type { AIReportProvider, AIProviderReportResult, AnalysisInputSnapshot } from "./types";
import { AIConfigurationError } from "./errors";

export class GeminiReportProvider implements AIReportProvider {
  readonly name = "gemini" as const;
  readonly modelName: string;

  constructor(_apiKey: string, model?: string) {
    this.modelName = model ?? "gemini-1.5-flash";
  }

  async generateGameReport(_input: AnalysisInputSnapshot): Promise<AIProviderReportResult> {
    throw new AIConfigurationError(
      "Gemini provider is configured but not yet implemented. " +
        "Install @google/generative-ai and implement lib/ai/gemini-provider.ts. " +
        "See the file for setup instructions."
    );
  }
}
