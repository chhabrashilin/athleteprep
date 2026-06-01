import type { AnalysisInputSnapshot, GeneratedGameReport } from "@/types/analysis";

export type AIProvider = "mock" | "openai" | "anthropic" | "gemini";

// Primary input/output types re-exported for convenience
export type { AnalysisInputSnapshot, GeneratedGameReport };

export interface AIServiceConfig {
  provider: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PromptTemplate {
  name: string;
  version: string;
  template: string;
}

// ---------------------------------------------------------------------------
// Provider interface — all real and mock providers implement this
// ---------------------------------------------------------------------------

export interface AIProviderTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AIProviderReportResult {
  provider: AIProvider;
  modelName: string;
  rawText?: string;
  parsedReport: GeneratedGameReport;
  usage?: AIProviderTokenUsage;
  metadata?: Record<string, unknown>;
}

export interface AIReportProvider {
  readonly name: AIProvider;
  readonly modelName: string;
  generateGameReport(input: AnalysisInputSnapshot): Promise<AIProviderReportResult>;
}

// ---------------------------------------------------------------------------
// Legacy types — kept for any existing import sites.
// ---------------------------------------------------------------------------
export interface LegacyGenerateReportInput {
  sport: string;
  gameMetadata: Record<string, unknown>;
  roster: Array<{ id: string; name: string; position?: string; number?: string }>;
  events: Array<{
    id: string;
    timeSeconds: number;
    eventType: string;
    description: string;
    playerIds: string[];
    importance: string;
    tags: string[];
  }>;
  coachNotes?: string;
  opponentNotes?: string;
  previousReportSummary?: string;
}
