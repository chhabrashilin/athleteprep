"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  Film,
  Settings,
  ChevronRight,
  Zap,
  LogOut,
  Plus,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { TeamContext } from "./AppShell";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function buildGeneralNav(): NavItem[] {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: "Teams",
      href: "/teams",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];
}

function buildTeamNav(teamId: string): NavItem[] {
  return [
    {
      label: "Overview",
      href: `/teams/${teamId}`,
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: "Roster",
      href: `/teams/${teamId}/players`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Games",
      href: `/teams/${teamId}/games`,
      icon: <Film className="h-4 w-4" />,
    },
  ];
}

interface AppSidebarProps {
  user?: User | null;
  teamContext?: TeamContext;
}

export function AppSidebar({ user, teamContext }: AppSidebarProps) {
  const pathname = usePathname();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Account";

  const initials = displayName.slice(0, 2).toUpperCase();

  const isInsideTeam = !!teamContext;
  const teamNavItems = isInsideTeam
    ? buildTeamNav(teamContext.teamId)
    : [];
  const generalNavItems = buildGeneralNav();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item);
    return (
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-slate-800 text-sky-400"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        )}
        aria-current={active ? "page" : undefined}
      >
        <span
          className={cn(
            active
              ? "text-sky-400"
              : "text-slate-500 group-hover:text-slate-300"
          )}
        >
          {item.icon}
        </span>
        {item.label}
        {active && (
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-sky-500/60" />
        )}
      </Link>
    );
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100">
          GameIQ
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        {/* Team-scoped nav */}
        {isInsideTeam && (
          <>
            {/* Team context indicator */}
            <div className="mb-2 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Team
              </p>
              <p className="text-sm font-medium text-slate-200 truncate">
                {teamContext.teamName}
              </p>
            </div>

            <ul className="space-y-0.5 mb-4">
              {teamNavItems.map((item) => (
                <li key={item.label}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>

            <div className="mb-2 px-3">
              <Link
                href={`/teams/${teamContext.teamId}/games/new`}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New game
              </Link>
            </div>

            <div className="my-3 border-t border-slate-800" />
          </>
        )}

        {/* General nav */}
        <ul className="space-y-0.5">
          {generalNavItems.map((item) => (
            <li key={item.label}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-4">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 shrink-0 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <span className="text-[10px] font-bold text-sky-400">
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-300">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-600">{user.email}</p>
            </div>
            <Link
              href="/auth/logout"
              className="text-slate-600 hover:text-slate-300 transition-colors ml-1"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-500">?</span>
            </div>
            <div className="min-w-0">
              <Link
                href="/auth/login"
                className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Sign in to GameIQ
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
