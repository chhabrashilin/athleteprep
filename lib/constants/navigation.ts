export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  badge?: string;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Teams", href: "/teams", icon: "Users" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export function buildTeamNav(teamId: string): NavItem[] {
  return [
    { label: "Overview", href: `/teams/${teamId}`, icon: "LayoutDashboard" },
    { label: "Roster", href: `/teams/${teamId}/players`, icon: "Users" },
    { label: "Games", href: `/teams/${teamId}/games`, icon: "Film" },
  ];
}
