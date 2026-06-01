"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface RatingInputProps {
  name: string;
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
}

const LABELS: Record<number, string> = {
  1: "Not useful",
  2: "Somewhat useful",
  3: "Useful",
  4: "Very useful",
  5: "Extremely useful",
};

export function RatingInput({ name, value, onChange, error }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(value ?? null);

  const active = hovered ?? selected;

  function handleSelect(n: number) {
    setSelected(n);
    onChange?.(n);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSelect(n)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
              active !== null && n <= active
                ? "border-sky-500 bg-sky-500/20 text-sky-300"
                : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            )}
            aria-label={`Rate ${n} — ${LABELS[n]}`}
          >
            {n}
          </button>
        ))}
        {active && (
          <span className="ml-2 text-sm text-slate-400">{LABELS[active]}</span>
        )}
      </div>
      <input type="hidden" name={name} value={selected ?? ""} />
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
