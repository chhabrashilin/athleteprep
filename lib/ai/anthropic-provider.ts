/**
 * Anthropic provider stub for GameIQ report generation.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install the Anthropic SDK:
 *    npm install @anthropic-ai/sdk
 * 2. Set in .env.local:
 *    AI_PROVIDER=anthropic
 *    ANTHROPIC_API_KEY=sk-ant-...
 *    ANTHROPIC_MODEL=claude-3-5-haiku-latest   (or claude-3-5-sonnet-20241022)
 *    NEXT_PUBLIC_ENABLE_REAL_AI=true
 * 3. Replace this stub with a real implementation following the same pattern
 *    as openai-provider.ts. Use messages API with `max_tokens` and instruct
 *    the model to return JSON only (Anthropic supports a content_type: "json"
 *    parameter via the API or via prefilling the assistant turn with "{").
 *
 * This stub throws a clear error rather than failing silently.
 */
import type { AIReportProvider, AIProviderReportResult, AnalysisInputSnapshot } from "./types";
import { AIConfigurationError } from "./errors";

export class AnthropicReportProvider implements AIReportProvider {
  readonly name = "anthropic" as const;
  readonly modelName: string;

  constructor(_apiKey: string, model?: string) {
    this.modelName = model ?? "claude-3-5-haiku-latest";
  }

  async generateGameReport(_input: AnalysisInputSnapshot): Promise<AIProviderReportResult> {
    throw new AIConfigurationError(
      "Anthropic provider is configured but not yet implemented. " +
        "Install @anthropic-ai/sdk and implement lib/ai/anthropic-provider.ts. " +
        "See the file for setup instructions."
    );
  }
}
