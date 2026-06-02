import { describe, it, expect } from "vitest";
import { buildSharedReportViewModel } from "@/lib/sharing/sanitize-report";
import { fixtureFullReport, fixtureShareLink } from "@/tests/fixtures/full-report";

describe("buildSharedReportViewModel — private_link", () => {
  const vm = buildSharedReportViewModel(
    fixtureFullReport,
    fixtureShareLink({ visibility: "private_link" })
  );

  it("includes executive summary", () => {
    expect(vm.executiveSummary).toBeTruthy();
  });

  it("includes coaching insights", () => {
    expect(vm.coachingInsights).toHaveLength(fixtureFullReport.insights.length);
  });

  it("includes player reports", () => {
    expect(vm.playerReports).toHaveLength(fixtureFullReport.playerReports.length);
  });

  it("includes practice recommendations", () => {
    expect(vm.practiceRecommendations).toHaveLength(
      fixtureFullReport.practiceRecommendations.length
    );
  });

  it("includes opponent tendencies", () => {
    expect(vm.opponentTendencies).toHaveLength(fixtureFullReport.opponentTendencies.length);
  });

  it("never exposes raw video URLs (canShowVideo is false)", () => {
    expect(vm.canShowVideo).toBe(false);
  });

  it("includes limitations", () => {
    expect(vm.limitations.length).toBeGreaterThan(0);
  });

  it("excludes fields not in SharedInsight (no rawAiOutput, no metadata)", () => {
    const insight = vm.coachingInsights[0];
    // These DB-layer fields must not leak
    expect("rawAiOutput" in insight).toBe(false);
    expect("metadata" in insight).toBe(false);
    expect("verificationStatus" in insight).toBe(false);
  });
});

describe("buildSharedReportViewModel — staff_only", () => {
  const vm = buildSharedReportViewModel(
    fixtureFullReport,
    fixtureShareLink({ visibility: "staff_only" })
  );

  it("includes all sections (same as private_link)", () => {
    expect(vm.coachingInsights).toHaveLength(fixtureFullReport.insights.length);
    expect(vm.playerReports).toHaveLength(fixtureFullReport.playerReports.length);
  });

  it("never exposes video URLs", () => {
    expect(vm.canShowVideo).toBe(false);
  });
});

describe("buildSharedReportViewModel — public_summary", () => {
  const vm = buildSharedReportViewModel(
    fixtureFullReport,
    fixtureShareLink({ visibility: "public_summary" })
  );

  it("includes executive summary", () => {
    expect(vm.executiveSummary).toBeTruthy();
  });

  it("excludes player reports entirely", () => {
    expect(vm.playerReports).toHaveLength(0);
  });

  it("excludes opponent tendencies", () => {
    expect(vm.opponentTendencies).toHaveLength(0);
  });

  it("includes coaching insights but hides tactical detail (whyItMatters and recommendedAction are null)", () => {
    expect(vm.coachingInsights.length).toBeGreaterThan(0);
    for (const insight of vm.coachingInsights) {
      expect(insight.whyItMatters).toBeNull();
      expect(insight.recommendedAction).toBeNull();
    }
  });

  it("includes insight title and summary", () => {
    const insight = vm.coachingInsights[0];
    expect(insight.title).toBeTruthy();
    expect(insight.summary).toBeTruthy();
  });

  it("practice recommendations omit coaching points and player IDs", () => {
    for (const rec of vm.practiceRecommendations) {
      expect(rec.coachingPoints).toHaveLength(0);
      expect(rec.playerIds).toHaveLength(0);
    }
  });

  it("excludes assumptions (empty)", () => {
    expect(vm.assumptions).toHaveLength(0);
  });

  it("includes limitations", () => {
    expect(vm.limitations.length).toBeGreaterThan(0);
  });
});

describe("buildSharedReportViewModel — player_specific", () => {
  it("includes only the selected player report", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-001" })
    );
    expect(vm.playerReports).toHaveLength(1);
    expect(vm.playerReports[0].id).toBe("pr-001");
  });

  it("excludes other player reports", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-001" })
    );
    const ids = vm.playerReports.map((p) => p.id);
    expect(ids).not.toContain("pr-002");
  });

  it("excludes team coaching insights", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-001" })
    );
    expect(vm.coachingInsights).toHaveLength(0);
  });

  it("excludes opponent tendencies", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-001" })
    );
    expect(vm.opponentTendencies).toHaveLength(0);
  });

  it("includes only practice recs linked to the selected player", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-003" })
    );
    // rec-001 is linked to player-003
    expect(vm.practiceRecommendations).toHaveLength(1);
    expect(vm.practiceRecommendations[0].id).toBe("rec-001");
  });

  it("returns empty playerReports when allowedPlayerId does not match any player", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-UNKNOWN" })
    );
    expect(vm.playerReports).toHaveLength(0);
  });

  it("never exposes canShowVideo as true", () => {
    const vm = buildSharedReportViewModel(
      fixtureFullReport,
      fixtureShareLink({ visibility: "player_specific", allowedPlayerId: "player-001" })
    );
    expect(vm.canShowVideo).toBe(false);
  });
});
