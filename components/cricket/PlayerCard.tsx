"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CricketPlayerFull, CricketRosterEntry } from "@/lib/cricket/types";

interface PlayerCardProps {
  player: CricketPlayerFull;
  rosterEntry?: CricketRosterEntry;
  href?: string;
  canManage?: boolean;
  onRemove?: () => void;
  onAssignCaptain?: () => void;
  onAssignViceCaptain?: () => void;
}

const ROLE_DISPLAY: Record<string, string> = {
  batter: "Batter",
  bowler: "Bowler",
  all_rounder: "All-rounder",
  wicketkeeper: "Wicketkeeper",
  captain: "Captain",
  coach: "Coach",
  unknown: "—",
};

const BATTING_DISPLAY: Record<string, string> = {
  right_hand_bat: "RHB",
  left_hand_bat: "LHB",
  unknown: "—",
};

const BOWLING_DISPLAY: Record<string, string> = {
  right_arm_fast: "RAF",
  right_arm_medium: "RAM",
  right_arm_spin: "RAS",
  left_arm_fast: "LAF",
  left_arm_medium: "LAM",
  left_arm_spin: "LAS",
  wicketkeeper: "WK",
  none: "—",
  unknown: "—",
};

export function PlayerCard({
  player,
  rosterEntry,
  href,
  canManage,
  onRemove,
  onAssignCaptain,
  onAssignViceCaptain,
}: PlayerCardProps) {
  const initials = player.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isCaptain = rosterEntry?.isCaptain ?? false;
  const isViceCaptain = rosterEntry?.isViceCaptain ?? false;
  const jerseyNumber = rosterEntry?.jerseyNumber;
  const role =
    player.primaryRole
      ? (ROLE_DISPLAY[player.primaryRole] ?? player.primaryRole)
      : player.role ?? "—";

  const battingLabel = player.battingStyle
    ? (BATTING_DISPLAY[player.battingStyle] ?? player.battingStyle)
    : null;

  const bowlingLabel = player.bowlingStyle
    ? (BOWLING_DISPLAY[player.bowlingStyle] ?? player.bowlingStyle)
    : null;

  const inner = (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 ${href ? "hover:border-sky-500/40 hover:bg-slate-800/60 transition-all cursor-pointer" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
          {player.profilePhotoUrl ? (
            <img
              src={player.profilePhotoUrl}
              alt={player.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-100 truncate">{player.displayName}</p>
            {jerseyNumber && (
              <span className="text-xs text-slate-500">#{jerseyNumber}</span>
            )}
            {isCaptain && (
              <span className="rounded-full bg-amber-400/10 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
                C
              </span>
            )}
            {isViceCaptain && (
              <span className="rounded-full bg-sky-400/10 border border-sky-500/30 px-2 py-0.5 text-xs font-medium text-sky-400">
                VC
              </span>
            )}
            {player.userId && (
              <span className="rounded-full bg-emerald-400/10 border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-400">
                Linked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span>{role}</span>
            {battingLabel && <span>· Bat: {battingLabel}</span>}
            {bowlingLabel && <span>· Bowl: {bowlingLabel}</span>}
          </div>
        </div>

        {href && <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
      </div>

      {/* Manage actions */}
      {canManage && (
        <div className="mt-2 flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800">
          {!isCaptain && onAssignCaptain && (
            <button
              onClick={(e) => { e.preventDefault(); onAssignCaptain(); }}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              Make captain
            </button>
          )}
          {!isViceCaptain && onAssignViceCaptain && (
            <button
              onClick={(e) => { e.preventDefault(); onAssignViceCaptain(); }}
              className="text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              Make VC
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => { e.preventDefault(); onRemove(); }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors ml-auto"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (href && !canManage) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl">
        {inner}
      </Link>
    );
  }

  return inner;
}
