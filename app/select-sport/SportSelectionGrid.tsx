"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CricketStatusBadge } from "@/components/cricket/CricketStatusBadge";
import { setLocalSelectedSport } from "@/lib/sports/preferences";
import { saveSportPreferenceAction } from "@/app/actions/sport-preferences";
import type { SportEntry } from "@/lib/sports/registry";
import type { CricketModuleStatus } from "@/components/cricket/CricketStatusBadge";

const SPORT_DESTINATIONS: Record<string, string> = {
  cricket: "/cricket",
  general: "/dashboard",
};

const SPORT_LONG_COPY: Record<string, string> = {
  cricket:
    "Cricket league management, scoring, scorecards, schedules, player profiles, and team intelligence.",
  general:
    "Use the existing GameIQ team, game, timestamp, and AI report workflow.",
};

function sportStatusToBadge(status: SportEntry["status"]): CricketModuleStatus {
  if (status === "enabled") return "available";
  if (status === "disabled") return "foundation_ready";
  return "coming_soon";
}

interface SportSelectionGridProps {
  sports: SportEntry[];
}

export function SportSelectionGrid({ sports }: SportSelectionGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(sport: SportEntry) {
    if (sport.status === "coming_soon") return;

    setLocalSelectedSport(sport.slug);

    startTransition(async () => {
      // Fire-and-forget Supabase sync — if unauthenticated, action returns
      // success: false silently. Navigation always proceeds regardless.
      await saveSportPreferenceAction(sport.slug);
    });

    const destination = SPORT_DESTINATIONS[sport.slug] ?? "/dashboard";
    router.push(destination);
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      role="list"
      aria-label="Available sports"
    >
      {sports.map((sport) => {
        const isDisabled = sport.status === "coming_soon";
        const badgeStatus = sportStatusToBadge(sport.status);
        const longCopy = SPORT_LONG_COPY[sport.slug] ?? sport.tagline;

        return (
          <button
            key={sport.slug}
            role="listitem"
            onClick={() => handleSelect(sport)}
            disabled={isDisabled || isPending}
            aria-label={
              isDisabled
                ? `${sport.displayName} — coming soon`
                : `Select ${sport.displayName}`
            }
            className={[
              "group flex flex-col gap-3 rounded-xl border bg-slate-900 p-6 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              isDisabled
                ? "cursor-not-allowed border-slate-800/40 opacity-50"
                : "cursor-pointer border-slate-800 hover:border-sky-500/60 hover:bg-slate-800/60",
            ].join(" ")}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {sport.icon}
                </span>
                <span
                  className={[
                    "text-base font-semibold transition-colors",
                    isDisabled
                      ? "text-slate-500"
                      : "text-slate-100 group-hover:text-sky-400",
                  ].join(" ")}
                >
                  {sport.displayName}
                </span>
              </div>
              <CricketStatusBadge status={badgeStatus} />
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed">{longCopy}</p>

            {/* CTA or coming-soon indicator */}
            {isDisabled ? (
              <span className="mt-auto text-xs text-slate-600">Coming soon</span>
            ) : (
              <span className="mt-auto text-xs font-medium text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Select →
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
