"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamKitRequest } from "@/lib/cricket/commerce/team-kits/actions";

interface Props {
  teamId: string;
  teamSlug: string;
  leagueId?: string;
}

const KIT_TYPE_OPTIONS = [
  { value: "full_team_kit", label: "Full Team Kit" },
  { value: "jerseys_only",  label: "Jerseys Only"   },
  { value: "pants_only",    label: "Pants Only"     },
  { value: "training_kit",  label: "Training Kit"   },
  { value: "fan_merch",     label: "Fan Merchandise"},
  { value: "custom",        label: "Custom"         },
] as const;

export function TeamKitRequestForm({ teamId, teamSlug, leagueId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const result = await createTeamKitRequest({
      team_id: teamId,
      league_id: leagueId ?? null,
      kit_type: fd.get("kit_type") as string,
      quantity_players: fd.get("quantity_players") ? Number(fd.get("quantity_players")) : null,
      quantity_staff: fd.get("quantity_staff") ? Number(fd.get("quantity_staff")) : null,
      primary_color: (fd.get("primary_color") as string) || null,
      secondary_color: (fd.get("secondary_color") as string) || null,
      design_notes: (fd.get("design_notes") as string) || null,
      delivery_deadline: (fd.get("delivery_deadline") as string) || null,
      budget_cents: fd.get("budget") ? Math.round(Number(fd.get("budget")) * 100) : null,
      currency: "USD",
      size_breakdown: {},
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to create kit request");
    } else {
      router.push(`/cricket/teams/${teamSlug}/kits/${result.data!.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Kit type */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Kit type <span className="text-rose-400">*</span>
        </label>
        <select
          name="kit_type"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          {KIT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Quantities */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Player quantity</label>
          <input
            name="quantity_players"
            type="number"
            min={1}
            max={500}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="11"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Staff quantity</label>
          <input
            name="quantity_staff"
            type="number"
            min={0}
            max={100}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="3"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Primary color</label>
          <input
            name="primary_color"
            type="color"
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 cursor-pointer"
            defaultValue="#1e40af"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Secondary color</label>
          <input
            name="secondary_color"
            type="color"
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 cursor-pointer"
            defaultValue="#ffffff"
          />
        </div>
      </div>

      {/* Deadline and Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Delivery deadline</label>
          <input
            name="delivery_deadline"
            type="date"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Budget (USD)</label>
          <input
            name="budget"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            placeholder="500.00"
          />
        </div>
      </div>

      {/* Design notes */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Design notes</label>
        <textarea
          name="design_notes"
          rows={4}
          maxLength={3000}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none"
          placeholder="Describe your design requirements, preferred style, sponsor logo placement, etc."
        />
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save kit request"}
        </button>
      </div>
    </form>
  );
}
