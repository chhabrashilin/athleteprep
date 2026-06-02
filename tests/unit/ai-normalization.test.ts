import { describe, it, expect } from "vitest";
import { normalizeGeneratedReport } from "@/lib/analysis/normalize-generated-report";
import { fixtureGeneratedReport } from "@/tests/fixtures/generated-report";
import { fixtureSnapshot } from "@/tests/fixtures/analysis-input";
import type { GeneratedGameReport } from "@/types/analysis";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

describe("normalizeGeneratedReport", () => {
  it("returns the report unchanged when all IDs are valid", () => {
    const { report, warnings } = normalizeGeneratedReport(
      fixtureGeneratedReport,
      fixtureSnapshot
    );
    expect(warnings).toHaveLength(0);
    expect(report.coachingInsights).toHaveLength(
      fixtureGeneratedReport.coachingInsights.length
    );
  });

  describe("unknown player ID removal", () => {
    it("strips unknown player IDs from affectedPlayerIds", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].affectedPlayerIds = ["player-001", "player-UNKNOWN"];
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.coachingInsights[0].affectedPlayerIds).toEqual(["player-001"]);
      expect(warnings.some((w) => w.includes("player-UNKNOWN"))).toBe(true);
    });

    it("strips unknown player IDs from evidence.playerIds", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].evidence[0].playerIds = ["player-001", "player-GHOST"];
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.coachingInsights[0].evidence[0].playerIds).toEqual(["player-001"]);
      expect(warnings.some((w) => w.includes("player-GHOST"))).toBe(true);
    });

    it("strips unknown playerId from player report and nullifies it", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.playerReports[0].playerId = "player-INVENTED";
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.playerReports[0].playerId).toBeNull();
      expect(warnings.some((w) => w.includes("player-INVENTED"))).toBe(true);
    });
  });

  describe("unknown event ID removal", () => {
    it("strips unknown event IDs from relatedEventIds", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].relatedEventIds = ["event-001", "event-FAKE"];
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.coachingInsights[0].relatedEventIds).toEqual(["event-001"]);
      expect(warnings.some((w) => w.includes("event-FAKE"))).toBe(true);
    });

    it("strips unknown eventId from evidence reference", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].evidence[0].eventId = "event-NONEXISTENT";
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.coachingInsights[0].evidence[0].eventId).toBeUndefined();
      expect(warnings.some((w) => w.includes("event-NONEXISTENT"))).toBe(true);
    });
  });

  describe("sort order assignment", () => {
    it("preserves existing sortOrder values", () => {
      const { report } = normalizeGeneratedReport(fixtureGeneratedReport, fixtureSnapshot);
      expect(report.coachingInsights[0].sortOrder).toBe(0);
      expect(report.coachingInsights[1].sortOrder).toBe(1);
    });

    it("assigns array index as sortOrder when missing", () => {
      const input = deepClone(fixtureGeneratedReport) as GeneratedGameReport & {
        coachingInsights: Array<{ sortOrder?: number }>;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (input.coachingInsights[0] as any).sortOrder;
      const { report } = normalizeGeneratedReport(input as GeneratedGameReport, fixtureSnapshot);
      expect(report.coachingInsights[0].sortOrder).toBe(0);
    });
  });

  describe("practice priority assignment", () => {
    it("preserves existing priority values", () => {
      const { report } = normalizeGeneratedReport(fixtureGeneratedReport, fixtureSnapshot);
      expect(report.practiceRecommendations[0].priority).toBe(1);
    });

    it("assigns index+1 as priority when missing", () => {
      const input = deepClone(fixtureGeneratedReport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (input.practiceRecommendations[0] as any).priority;
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.practiceRecommendations[0].priority).toBe(1);
    });
  });

  describe("V1 limitation guard", () => {
    it("adds V1 limitation if none mentions 'automated' or 'manually tagged'", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.limitations = ["Some other limitation without keywords."];
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      const hasV1 = report.limitations.some(
        (l) => l.toLowerCase().includes("automated") || l.toLowerCase().includes("manually tagged")
      );
      expect(hasV1).toBe(true);
    });

    it("does not duplicate V1 limitation if already present", () => {
      const { report } = normalizeGeneratedReport(fixtureGeneratedReport, fixtureSnapshot);
      const v1Count = report.limitations.filter(
        (l) => l.toLowerCase().includes("automated") || l.toLowerCase().includes("manually tagged")
      ).length;
      expect(v1Count).toBe(1);
    });
  });

  describe("fallback evidence when evidence array is empty", () => {
    it("adds a game_metadata fallback when evidence array starts empty", () => {
      const input = deepClone(fixtureGeneratedReport);
      // Normalization adds a fallback when the evidence array is empty
      input.coachingInsights[0].evidence = [];
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.coachingInsights[0].evidence).toHaveLength(1);
      expect(report.coachingInsights[0].evidence[0].type).toBe("game_metadata");
    });

    it("strips an unknown eventId from evidence but keeps the evidence item", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].evidence = [
        {
          id: "ev-bad",
          type: "timestamp",
          label: "Phantom event",
          eventId: "event-DOES-NOT-EXIST",
          playerIds: [],
        },
      ];
      const { report, warnings } = normalizeGeneratedReport(input, fixtureSnapshot);
      // The evidence item stays (type is still "timestamp") but eventId is cleared
      expect(report.coachingInsights[0].evidence).toHaveLength(1);
      expect(report.coachingInsights[0].evidence[0].eventId).toBeUndefined();
      expect(warnings.some((w) => w.includes("event-DOES-NOT-EXIST"))).toBe(true);
    });
  });

  describe("warning counter in limitations", () => {
    it("appends a normalization note when warnings were generated", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.coachingInsights[0].affectedPlayerIds = ["player-GHOST"];
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      const hasNormNote = report.limitations.some((l) =>
        l.includes("removed during normalization")
      );
      expect(hasNormNote).toBe(true);
    });
  });

  describe("empty arrays", () => {
    it("handles reports with empty playerReports array", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.playerReports = [];
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.playerReports).toHaveLength(0);
    });

    it("handles reports with empty opponentTendencies array", () => {
      const input = deepClone(fixtureGeneratedReport);
      input.opponentTendencies = [];
      const { report } = normalizeGeneratedReport(input, fixtureSnapshot);
      expect(report.opponentTendencies).toHaveLength(0);
    });
  });
});
