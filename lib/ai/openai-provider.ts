/**
 * OpenAI provider for GameIQ report generation.
 * Server-side only — never import in client components.
 * Requires: OPENAI_API_KEY, AI_PROVIDER=openai, NEXT_PUBLIC_ENABLE_REAL_AI=true
 */
import OpenAI from "openai";
import type { AIReportProvider, AIProviderReportResult, AnalysisInputSnapshot } from "./types";
import { buildReportSystemPrompt, buildReportUserPrompt } from "./report-prompts";
import { parseAndValidateReport } from "./json-repair";
import { AIProviderError, AIConfigurationError } from "./errors";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 8000;
const TEMPERATURE = 0.2;

export class OpenAIReportProvider implements AIReportProvider {
  readonly name = "openai" as const;
  readonly modelName: string;
  private client: OpenAI;

  constructor(apiKey: string, model?: string) {
    if (!apiKey) throw new AIConfigurationError("OpenAI API key is required.");
    this.client = new OpenAI({ apiKey });
    this.modelName = model ?? DEFAULT_MODEL;
  }

  async generateGameReport(input: AnalysisInputSnapshot): Promise<AIProviderReportResult> {
    const systemPrompt = buildReportSystemPrompt(input.game.sport);
    const userPrompt = buildReportUserPrompt(input);

    let rawText: string | undefined;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      rawText = response.choices[0]?.message?.content ?? undefined;

      if (!rawText) {
        throw new AIProviderError(
          "OpenAI returned an empty response. Please try again.",
          "openai"
        );
      }

      const parsedReport = parseAndValidateReport(rawText);

      return {
        provider: "openai",
        modelName: this.modelName,
        rawText,
        parsedReport,
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        metadata: {
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (err) {
      if (err instanceof AIProviderError || err instanceof Error) {
        // Re-wrap with provider context if not already wrapped
        if (!(err instanceof AIProviderError)) {
          throw new AIProviderError(
            `OpenAI generation failed: ${err.message}`,
            "openai",
            rawText
          );
        }
        throw err;
      }
      throw new AIProviderError(
        "OpenAI generation failed with an unknown error.",
        "openai",
        rawText
      );
    }
  }
}
