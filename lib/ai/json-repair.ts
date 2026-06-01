import { GeneratedGameReportSchema } from "./report-schema";
import { AIJsonParseError, AISchemaValidationError } from "./errors";
import type { GeneratedGameReport } from "@/types/analysis";

/**
 * Strips Markdown code fences and leading/trailing whitespace from AI text.
 * Handles ```json ... ``` and ``` ... ``` and bare JSON objects.
 */
export function extractJsonObject(text: string): string {
  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Find the first { and last } to extract just the JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
    throw new AIJsonParseError(
      "No JSON object found in AI response. The model did not return valid JSON.",
      text
    );
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

/**
 * Parses a JSON string safely.
 * Throws AIJsonParseError if parsing fails.
 */
export function parseJsonSafely(text: string): unknown {
  const extracted = extractJsonObject(text);
  try {
    return JSON.parse(extracted);
  } catch (err) {
    throw new AIJsonParseError(
      `AI response is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      text
    );
  }
}

/**
 * Validates a parsed value against the GeneratedGameReport Zod schema.
 * Throws AISchemaValidationError if validation fails.
 * Returns a fully typed GeneratedGameReport on success.
 */
export function validateGeneratedReport(value: unknown): GeneratedGameReport {
  const result = GeneratedGameReportSchema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    throw new AISchemaValidationError(
      `AI output failed schema validation (${issues.length} issue${issues.length !== 1 ? "s" : ""}). The model returned an unexpected format.`,
      issues
    );
  }

  return result.data as GeneratedGameReport;
}

/**
 * Full parse + validate pipeline.
 * Extracts JSON, parses it, validates it.
 */
export function parseAndValidateReport(rawText: string): GeneratedGameReport {
  const parsed = parseJsonSafely(rawText);
  return validateGeneratedReport(parsed);
}
