# GameIQ — Real AI Provider Layer

> Describes the provider-agnostic AI architecture, environment configuration, prompt design, schema validation, normalization, hallucination guardrails, and future plans.

---

## 1. Overview

The GameIQ AI layer is provider-agnostic. It supports Mock, OpenAI, Anthropic, and Gemini through a unified interface. The active provider is selected at runtime via environment variables — no code changes required to switch providers.

All AI generation is **server-side only**. API keys never reach the browser.

---

## 2. Provider Architecture

```
lib/ai/
├── types.ts               — AIReportProvider interface, AIProviderReportResult
├── errors.ts              — Typed error classes (config, provider, schema, parse)
├── report-schema.ts       — Zod schema for GeneratedGameReport (strict validation)
├── report-prompts.ts      — System/user prompt builders + cost-control constants
├── json-repair.ts         — JSON extraction, parsing, schema validation pipeline
├── provider-factory.ts    — Factory: reads env → returns configured provider
├── mock-ai.ts             — Mock provider (deterministic, data-driven)
├── openai-provider.ts     — OpenAI provider (fully implemented)
├── anthropic-provider.ts  — Anthropic provider (stub — see setup instructions)
├── gemini-provider.ts     — Gemini provider (stub — see setup instructions)
└── generate-game-report.ts — High-level async generation + normalization entry point
```

---

## 3. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `mock` | Active provider. Options: `mock`, `openai`, `anthropic`, `gemini` |
| `NEXT_PUBLIC_ENABLE_REAL_AI` | `false` | Must be `true` to enable real AI calls |
| `OPENAI_API_KEY` | — | Required when `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | — | Required when `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` | — | Required when `AI_PROVIDER=gemini` |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model override |
| `ANTHROPIC_MODEL` | `claude-3-5-haiku-latest` | Anthropic model override |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model override |

**Security:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GEMINI_API_KEY` are server-only. Never prefix them with `NEXT_PUBLIC_`.

---

## 4. Provider Resolution Order

```
NEXT_PUBLIC_ENABLE_REAL_AI = "false"  →  always mock
AI_PROVIDER = "mock" (or unset)        →  mock
AI_PROVIDER = "openai" + key present   →  OpenAIReportProvider
AI_PROVIDER = "openai" + key missing   →  AIConfigurationError (clear message)
AI_PROVIDER = "anthropic"              →  AnthropicReportProvider (stub)
AI_PROVIDER = "gemini"                 →  GeminiReportProvider (stub)
```

---

## 5. Mock Mode

Mock mode (`AI_PROVIDER=mock` or `NEXT_PUBLIC_ENABLE_REAL_AI=false`) uses `lib/ai/mock-ai.ts`:

- Deterministic — same input produces same output
- Uses real event labels, player names, timestamps, and notes
- Never fabricates data not present in the input
- Zero API cost
- Correct mode for all local development

---

## 6. OpenAI Provider

**Status:** Fully implemented.

**Setup:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # or gpt-4o, gpt-4-turbo
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

Uses `openai` SDK v6+ with:
- `response_format: { type: "json_object" }` for guaranteed JSON output
- Temperature: 0.2 (low randomness for consistent structured output)
- Max tokens: 8000

---

## 7. Anthropic Provider (Stub)

**Status:** Stub — throws `AIConfigurationError` if selected.

**To implement:**
1. `npm install @anthropic-ai/sdk`
2. Follow the pattern in `openai-provider.ts`
3. Use the messages API with a prefilled `"{"` assistant turn or the `betas.tools` approach for structured JSON

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-latest
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

---

## 8. Gemini Provider (Stub)

**Status:** Stub — throws `AIConfigurationError` if selected.

**To implement:**
1. `npm install @google/generative-ai`
2. Follow the pattern in `openai-provider.ts`
3. Use `responseMimeType: "application/json"` for structured output

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AI...
GEMINI_MODEL=gemini-1.5-flash
NEXT_PUBLIC_ENABLE_REAL_AI=true
```

---

## 9. Provider Interface

All providers implement `AIReportProvider`:

```ts
interface AIReportProvider {
  readonly name: AIProvider;
  readonly modelName: string;
  generateGameReport(input: AnalysisInputSnapshot): Promise<AIProviderReportResult>;
}
```

`AIProviderReportResult` includes:
- `provider` — which provider ran
- `modelName` — exact model used
- `parsedReport` — validated `GeneratedGameReport`
- `usage` — token counts (if available)
- `rawText` — raw string from provider (stored for debugging)
- `metadata` — provider-specific metadata (finish reason, etc.)

---

## 10. Strict JSON Schema Validation

`lib/ai/report-schema.ts` uses Zod to define `GeneratedGameReportSchema`.

Key constraints:
- `coachingInsights`: min 1, max 5
- `practiceRecommendations`: min 1, max 6
- Each insight must have min 1 evidence reference
- All confidence values must be `"high" | "medium" | "low"`
- String lengths are bounded (no runaway text)

Validation runs after every AI response via `parseAndValidateReport()` in `lib/ai/json-repair.ts`.

---

## 11. JSON Parsing and Repair

`lib/ai/json-repair.ts` provides:

1. **`extractJsonObject(text)`** — Strips Markdown fences, finds `{...}` boundaries
2. **`parseJsonSafely(text)`** — Parses extracted JSON, throws `AIJsonParseError` on failure
3. **`validateGeneratedReport(value)`** — Validates against Zod schema, throws `AISchemaValidationError`
4. **`parseAndValidateReport(rawText)`** — Full pipeline

If parsing fails, the error includes the raw provider text for debugging.

---

## 12. Prompt Design

`lib/ai/report-prompts.ts` builds two-part prompts:

**System prompt** (`buildReportSystemPrompt(sport)`):
- Elite sports analyst persona
- 14 hard rules (no invented IDs, no video frame claims, JSON-only output, etc.)
- Sport-specific guidance (soccer, basketball, cricket, etc.)
- Full output schema specification

**User prompt** (`buildReportUserPrompt(snapshot)`):
- Game metadata, roster, events in compact text format
- Allowed player IDs and event IDs (AI must only use these)
- Coach notes, opponent notes, summary notes (truncated if too long)
- Instruction to return a single JSON object with no surrounding text

---

## 13. Cost Control

Constants in `lib/ai/report-prompts.ts`:

| Constant | Value | Effect |
|----------|-------|--------|
| `MAX_ANALYSIS_EVENTS` | 80 | Top 80 events by importance are sent |
| `MAX_ANALYSIS_PLAYERS` | 40 | First 40 roster players are sent |
| `MAX_NOTE_CHARS` | 6000 | Notes truncated at 6000 chars |

Truncation is noted in the user prompt and added as a `limitation` in the generated report.

---

## 14. Normalization and Hallucination Guards

`lib/analysis/normalize-generated-report.ts` runs after AI generation:

1. **Removes unknown player IDs** from `affectedPlayerIds`, `relatedEventIds`, evidence `playerIds`
2. **Removes unknown event IDs** from evidence `eventId`, key moments `eventId`
3. **Ensures every insight has at least one evidence reference** (adds fallback if stripped)
4. **Assigns sort orders** to insights if missing
5. **Assigns priorities** to practice recs if missing
6. **Ensures v1 limitation** is present in `limitations`
7. **Logs warnings** for all stripped IDs
8. **Adds a limitations note** if any IDs were stripped

---

## 15. Analysis Job Metadata

After generation, `analysis_jobs` stores:
- `provider`: the actual provider used (`mock`, `openai`, etc.)
- `model_name`: the exact model (e.g., `gpt-4o-mini`)
- `input_snapshot`: full analysis input
- `output_snapshot`: report summary + provider + model + token usage + normalization warnings

`game_reports.raw_ai_output` stores the generated report plus a `_meta` object with provider, model, `generatedAt`, usage, and normalization warnings.

---

## 16. Error Handling

| Error | User message | Logged |
|-------|-------------|--------|
| `AIConfigurationError` | "AI provider is not configured. Check environment variables." | Yes |
| `AIProviderError` | "Report generation failed because the AI provider returned an unexpected response. Try again." | Yes |
| `AISchemaValidationError` | "Report generation failed — the model returned an invalid format. Try again or switch to mock mode." | Yes |
| `AIJsonParseError` | Same as above | Yes |
| Network/timeout | "Report generation failed. Try again." | Yes |

---

## 17. Current Limitations

- Anthropic and Gemini providers are stubs — not yet implemented
- No retry logic for malformed JSON (one attempt, fail with clear error)
- No streaming response support
- No RAG over historical reports
- No fine-tuning
- Token usage tracking is provider-dependent (OpenAI provides it, others may not)
- No server-side PDF generation for AI-generated reports
- No automated video frame analysis (computer vision is a future phase)

---

## 18. Future Work

- Full Anthropic provider implementation
- Full Gemini provider implementation
- Retry once with repair prompt if JSON parse fails
- Streaming response with incremental UI updates
- RAG over team's historical reports for trend-aware insights
- Sport-specific prompt packs
- Fine-tuning on verified coach feedback
- Cost tracking dashboard
