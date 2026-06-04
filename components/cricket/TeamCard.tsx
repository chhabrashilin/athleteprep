"use client";

import Link from "next/link";
import { Users, MapPin, ChevronRight } from "lucide-react";
import type { CricketTeamFull } from "@/lib/cricket/types";

interface TeamCardProps {
  team: CricketTeamFull;
  rosterCount?: number;
  href?: string;
}

const REG_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:     { label: "Draft",     color: "text-slate-400 bg-slate-800 border-slate-700" },
  submitted: { label: "Submitted", color: "text-amber-400 bg-amber-400/10 border-amber-500/30" },
  approved:  { label: "Approved",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30" },
  rejected:  { label: "Rejected",  color: "text-rose-400 bg-rose-400/10 border-rose-500/30" },
  archived:  { label: "Archived",  color: "text-slate-500 bg-slate-800 border-slate-700" },
};

export function TeamCard({ team, rosterCount, href }: TeamCardProps) {
  const regStatus = REG_STATUS_CONFIG[team.registrationStatus] ?? REG_STATUS_CONFIG.draft;
  const initials = team.shortName
    ? team.shortName.slice(0, 3).toUpperCase()
    : team.name.slice(0, 2).toUpperCase();

  const inner = (
    <div
      className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all ${
        href
          ? "border-slate-800 bg-slate-900 hover:border-sky-500/40 hover:bg-slate-800/60 cursor-pointer"
          : "border-slate-800 bg-slate-900"
      }`}
    >
      {/* Logo / initials */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
        style={{ backgroundColor: team.primaryColor ?? "#334155" }}
      >
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-100 truncate">{team.name}</p>
          {team.shortName && (
            <span className="text-xs text-slate-500">({team.shortName})</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {team.homeGround && (
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {team.homeGround}
            </span>
          )}
          {rosterCount !== undefined && (
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {rosterCount} {rosterCount === 1 ? "player" : "players"}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${regStatus.color}`}
      >
        {regStatus.label}
      </span>

      {href && <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl block"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
