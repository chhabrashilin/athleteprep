"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CricketStatusBadge } from "@/components/cricket/CricketStatusBadge";
import { setLocalSelectedSport } from "@/lib/sports/preferences";
import { saveSportPreferenceAction } from "@/app/actions/sport-preferences";
import type { SportSlug } from "@/lib/sports/registry";
import type { CricketModuleStatus } from "@/components/cricket/CricketStatusBadge";

interface SportOption {
  slug: SportSlug;
  label: string;
  description: string;
  icon: string;
  badge: CricketModuleStatus;
  destination: string;
  disabled?: boolean;
}

const SPORT_OPTIONS: SportOption[] = [
  {
    slug: "general",
    label: "General Sports",
    description: "Team management, games, timestamps, and AI reports.",
    icon: "⚡",
    badge: "available",
    destination: "/dashboard",
  },
  {
    slug: "cricket",
    label: "Cricket",
    description: "League management, matches, players, schedules, and scorecards.",
    icon: "🏏",
    badge: "foundation_ready",
    destination: "/cricket",
  },
  {
    slug: "baseball",
    label: "Baseball",
    description: "Coming soon.",
    icon: "⚾",
    badge: "coming_soon",
    destination: "/select-sport",
    disabled: true,
  },
  {
    slug: "basketball",
    label: "Basketball",
    description: "Coming soon.",
    icon: "🏀",
    badge: "coming_soon",
    destination: "/select-sport",
    disabled: true,
  },
];

interface SportPreferenceCardProps {
  currentSport: SportSlug;
}

export function SportPreferenceCard({ currentSport }: SportPreferenceCardProps) {
  const [selected, setSelected] = useState<SportSlug>(currentSport);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setLocalSelectedSport(selected);
    startTransition(async () => {
      const result = await saveSportPreferenceAction(selected);
      setSaveState(result.success ? "saved" : "error");
      // Reset feedback after 3 s
      setTimeout(() => setSaveState("idle"), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Sport preference"
      >
        {SPORT_OPTIONS.map((opt) => {
          const isActive = selected === opt.slug;
          return (
            <button
              key={opt.slug}
              role="radio"
              aria-checked={isActive}
              disabled={opt.disabled}
              onClick={() => !opt.disabled && setSelected(opt.slug)}
              className={[
                "flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                opt.disabled
                  ? "cursor-not-allowed border-slate-800/40 opacity-40"
                  : isActive
                  ? "cursor-pointer border-sky-500/60 bg-sky-500/5"
                  : "cursor-pointer border-slate-800 hover:border-slate-600 hover:bg-slate-800/40",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{opt.icon}</span>
                  <span className="text-sm font-semibold text-slate-100">
                    {opt.label}
                  </span>
                </div>
                <CricketStatusBadge status={opt.badge} />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Save row */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || selected === currentSport}
        >
          <Globe className="h-3.5 w-3.5" />
          {isPending ? "Saving…" : "Save preference"}
        </Button>

        {saveState === "saved" && (
          <span className="text-xs font-medium text-emerald-400">
            Preference saved.
          </span>
        )}
        {saveState === "error" && (
          <span className="text-xs text-amber-400">
            Could not save — preference updated locally.
          </span>
        )}
      </div>

      {/* Quick navigation */}
      <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Open General Dashboard
          </Button>
        </Link>
        <Link href="/cricket">
          <Button variant="secondary" size="sm">
            <span aria-hidden="true">🏏</span>
            Open Cricket Hub
          </Button>
        </Link>
      </div>
    </div>
  );
}
