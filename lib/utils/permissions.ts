import type { TeamRole } from "@/types/core";

const STAFF_ROLES: TeamRole[] = ["owner", "coach", "analyst"];
const MANAGER_ROLES: TeamRole[] = ["owner", "coach"];

/** Can create/edit content (roster, games, timestamps, reports). */
export function canManageTeamContent(role: TeamRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Can trigger AI report generation. */
export function canGenerateReport(role: TeamRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Can inline-edit AI report sections and verify insights. */
export function canEditReport(role: TeamRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Can create and revoke share links. */
export function canShareReport(role: TeamRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Can access the export / print view. */
export function canExportReport(role: TeamRole): boolean {
  return STAFF_ROLES.includes(role);
}

/** Can delete teams, games, or players permanently. */
export function canDeleteContent(role: TeamRole): boolean {
  return MANAGER_ROLES.includes(role);
}

/** Read-only access (player or viewer). Cannot write anything. */
export function isReadOnlyRole(role: TeamRole): boolean {
  return !STAFF_ROLES.includes(role);
}
