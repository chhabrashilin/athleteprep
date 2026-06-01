/**
 * AI provider factory — selects the configured provider based on env vars.
 * Server-side only. All real API keys must remain server-side.
 */
import type { AIProvider, AIReportProvider, AIServiceConfig } from "./types";
import { AIConfigurationError } from "./errors";
import { generateMockGameReport } from "./mock-ai";
import { OpenAIReportProvider } from "./openai-provider";
import { AnthropicReportProvider } from "./anthropic-provider";
import { GeminiReportProvider } from "./gemini-provider";
import type { AnalysisInputSnapshot, GeneratedGameReport } from "@/types/analysis";
import type { AIProviderReportResult } from "./types";

// ---------------------------------------------------------------------------
// Mock provider wrapper (implements AIReportProvider interface)
// ---------------------------------------------------------------------------

class MockReportProvider implements AIReportProvider {
  readonly name = "mock" as const;
  readonly modelName = "mock-v1";

  async generateGameReport(input: AnalysisInputSnapshot): Promise<AIProviderReportResult> {
    const parsedReport: GeneratedGameReport = generateMockGameReport(input);
    return {
      provider: "mock",
      modelName: "mock-v1",
      parsedReport,
      usage: undefined,
      metadata: { source: "mock-ai" },
    };
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  isRealAI: boolean;
}

export function getAIProviderConfig(): AIProviderConfig {
  const enableRealAI = process.env.NEXT_PUBLIC_ENABLE_REAL_AI === "true";
  const configuredProvider = (process.env.AI_PROVIDER as AIProvider | undefined) ?? "mock";
  const effectiveProvider: AIProvider = enableRealAI ? configuredProvider : "mock";

  const modelMap: Record<AIProvider, string> = {
    mock: "mock-v1",
    openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    anthropic: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
    gemini: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  };

  return {
    provider: effectiveProvider,
    model: modelMap[effectiveProvider],
    isRealAI: enableRealAI && effectiveProvider !== "mock",
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns the configured AIReportProvider based on environment variables.
 *
 * Resolution order:
 * 1. If NEXT_PUBLIC_ENABLE_REAL_AI != "true" → mock
 * 2. If AI_PROVIDER=mock (or not set) → mock
 * 3. If AI_PROVIDER=openai → OpenAIReportProvider (requires OPENAI_API_KEY)
 * 4. If AI_PROVIDER=anthropic → AnthropicReportProvider (requires ANTHROPIC_API_KEY)
 * 5. If AI_PROVIDER=gemini → GeminiReportProvider (requires GEMINI_API_KEY)
 */
export function getConfiguredAIProvider(): AIReportProvider {
  const config = getAIProviderConfig();

  if (!config.isRealAI || config.provider === "mock") {
    return new MockReportProvider();
  }

  switch (config.provider) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AIConfigurationError(
          "AI_PROVIDER is set to 'openai' but OPENAI_API_KEY is not configured. " +
            "Add OPENAI_API_KEY to your environment variables or set AI_PROVIDER=mock."
        );
      }
      return new OpenAIReportProvider(apiKey, config.model);
    }

    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AIConfigurationError(
          "AI_PROVIDER is set to 'anthropic' but ANTHROPIC_API_KEY is not configured. " +
            "Add ANTHROPIC_API_KEY to your environment variables or set AI_PROVIDER=mock."
        );
      }
      return new AnthropicReportProvider(apiKey, config.model);
    }

    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new AIConfigurationError(
          "AI_PROVIDER is set to 'gemini' but GEMINI_API_KEY is not configured. " +
            "Add GEMINI_API_KEY to your environment variables or set AI_PROVIDER=mock."
        );
      }
      return new GeminiReportProvider(apiKey, config.model);
    }

    default:
      throw new AIConfigurationError(
        `Unknown AI provider: "${config.provider}". Valid options: mock, openai, anthropic, gemini.`
      );
  }
}

// Legacy config accessor (backward compat with lib/ai/providers.ts)
export function getAIConfig(): AIServiceConfig {
  const config = getAIProviderConfig();
  return {
    provider: config.provider,
    model: config.model,
    maxTokens: 8000,
    temperature: 0.2,
  };
}
