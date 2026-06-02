import { describe, it, expect } from "vitest";
import { GeneratedGameReportSchema } from "@/lib/ai/report-schema";
import { fixtureGeneratedReport } from "@/tests/fixtures/generated-report";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

describe("GeneratedGameReportSchema", () => {
  it("accepts a valid generated report", () => {
    const result = GeneratedGameReportSchema.safeParse(fixtureGeneratedReport);
    expect(result.success).toBe(true);
  });

  describe("executiveSummary", () => {
    it("rejects a report with missing executiveSummary", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (report as any).executiveSummary;
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects an executiveSummary shorter than 50 characters", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.executiveSummary = "Too short.";
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });

  describe("coachingInsights", () => {
    it("rejects when coachingInsights array is empty", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.coachingInsights = [];
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects when coachingInsights exceeds 5", () => {
      const report = deepClone(fixtureGeneratedReport);
      const insight = deepClone(fixtureGeneratedReport.coachingInsights[0]);
      report.coachingInsights = [insight, insight, insight, insight, insight, insight];
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects an insight with invalid confidence level", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (report.coachingInsights[0] as any).confidence = "very_high";
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects a coaching insight with no evidence", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.coachingInsights[0].evidence = [];
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });

  describe("playerReports", () => {
    it("rejects a player report with invalid confidence", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (report.playerReports[0] as any).confidence = "extreme";
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects a player report with missing summary", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (report.playerReports[0] as any).summary;
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });

  describe("practiceRecommendations", () => {
    it("rejects when practiceRecommendations array is empty", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.practiceRecommendations = [];
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects a practice recommendation with durationMinutes of 0", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.practiceRecommendations[0].durationMinutes = 0;
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects a practice recommendation with durationMinutes over 240", () => {
      const report = deepClone(fixtureGeneratedReport);
      report.practiceRecommendations[0].durationMinutes = 241;
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });

  describe("opponentTendencies", () => {
    it("rejects an opponent tendency with missing title", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (report.opponentTendencies[0] as any).title;
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });

    it("rejects an opponent tendency with invalid confidence", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (report.opponentTendencies[0] as any).confidence = "unknown";
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });

  describe("overall confidence", () => {
    it("accepts 'high', 'medium', 'low' as valid overallConfidence values", () => {
      for (const level of ["high", "medium", "low"] as const) {
        const report = deepClone(fixtureGeneratedReport);
        report.overallConfidence = level;
        const result = GeneratedGameReportSchema.safeParse(report);
        expect(result.success).toBe(true);
      }
    });

    it("rejects an invalid overallConfidence value", () => {
      const report = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (report as any).overallConfidence = "extreme";
      const result = GeneratedGameReportSchema.safeParse(report);
      expect(result.success).toBe(false);
    });
  });
});
