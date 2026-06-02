import { describe, it, expect } from "vitest";
import {
  canManageTeamContent,
  canGenerateReport,
  canEditReport,
  canShareReport,
  canExportReport,
  canDeleteContent,
  isReadOnlyRole,
} from "@/lib/utils/permissions";
import type { TeamRole } from "@/types/core";

const staffRoles: TeamRole[] = ["owner", "coach", "analyst"];
const readOnlyRoles: TeamRole[] = ["player", "viewer"];
const allRoles: TeamRole[] = [...staffRoles, ...readOnlyRoles];

describe("canManageTeamContent", () => {
  it("returns true for staff roles", () => {
    for (const role of staffRoles) {
      expect(canManageTeamContent(role)).toBe(true);
    }
  });

  it("returns false for player and viewer", () => {
    for (const role of readOnlyRoles) {
      expect(canManageTeamContent(role)).toBe(false);
    }
  });
});

describe("canGenerateReport", () => {
  it("returns true for owner, coach, analyst", () => {
    for (const role of staffRoles) {
      expect(canGenerateReport(role)).toBe(true);
    }
  });

  it("returns false for player and viewer", () => {
    for (const role of readOnlyRoles) {
      expect(canGenerateReport(role)).toBe(false);
    }
  });
});

describe("canEditReport", () => {
  it("owner can edit", () => {
    expect(canEditReport("owner")).toBe(true);
  });

  it("coach can edit", () => {
    expect(canEditReport("coach")).toBe(true);
  });

  it("analyst can edit", () => {
    expect(canEditReport("analyst")).toBe(true);
  });

  it("player cannot edit", () => {
    expect(canEditReport("player")).toBe(false);
  });

  it("viewer cannot edit", () => {
    expect(canEditReport("viewer")).toBe(false);
  });
});

describe("canShareReport", () => {
  it("returns true for staff roles", () => {
    for (const role of staffRoles) {
      expect(canShareReport(role)).toBe(true);
    }
  });

  it("returns false for read-only roles", () => {
    for (const role of readOnlyRoles) {
      expect(canShareReport(role)).toBe(false);
    }
  });
});

describe("canExportReport", () => {
  it("returns true for staff roles", () => {
    for (const role of staffRoles) {
      expect(canExportReport(role)).toBe(true);
    }
  });

  it("returns false for player and viewer", () => {
    for (const role of readOnlyRoles) {
      expect(canExportReport(role)).toBe(false);
    }
  });
});

describe("canDeleteContent", () => {
  it("owner can delete", () => {
    expect(canDeleteContent("owner")).toBe(true);
  });

  it("coach can delete", () => {
    expect(canDeleteContent("coach")).toBe(true);
  });

  it("analyst cannot delete", () => {
    expect(canDeleteContent("analyst")).toBe(false);
  });

  it("player cannot delete", () => {
    expect(canDeleteContent("player")).toBe(false);
  });

  it("viewer cannot delete", () => {
    expect(canDeleteContent("viewer")).toBe(false);
  });
});

describe("isReadOnlyRole", () => {
  it("player is read-only", () => {
    expect(isReadOnlyRole("player")).toBe(true);
  });

  it("viewer is read-only", () => {
    expect(isReadOnlyRole("viewer")).toBe(true);
  });

  it("staff roles are not read-only", () => {
    for (const role of staffRoles) {
      expect(isReadOnlyRole(role)).toBe(false);
    }
  });
});

describe("permission consistency", () => {
  it("every role that can generate also can edit and share", () => {
    for (const role of allRoles) {
      if (canGenerateReport(role)) {
        expect(canEditReport(role)).toBe(true);
        expect(canShareReport(role)).toBe(true);
        expect(canExportReport(role)).toBe(true);
      }
    }
  });

  it("roles that cannot manage content also cannot generate, edit, share, or export", () => {
    for (const role of allRoles) {
      if (!canManageTeamContent(role)) {
        expect(canGenerateReport(role)).toBe(false);
        expect(canEditReport(role)).toBe(false);
        expect(canShareReport(role)).toBe(false);
        expect(canExportReport(role)).toBe(false);
      }
    }
  });
});
