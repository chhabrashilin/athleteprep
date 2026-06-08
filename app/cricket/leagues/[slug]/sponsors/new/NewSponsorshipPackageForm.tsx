"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSponsorshipPackage } from "@/lib/cricket/commerce/sponsorship/actions";

const PACKAGE_TYPES = [
  { value: "league",    label: "League Sponsorship"    },
  { value: "match",     label: "Match Sponsorship"     },
  { value: "broadcast", label: "Broadcast Sponsorship" },
  { value: "overlay",   label: "Overlay Sponsorship"   },
  { value: "jersey",    label: "Jersey Sponsorship"    },
  { value: "ground",    label: "Ground Sponsorship"    },
  { value: "digital",   label: "Digital Sponsorship"   },
  { value: "custom",    label: "Custom"                },
] as const;

interface Props { leagueSlug: string }

export function NewSponsorshipPackageForm({ leagueSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueId, setLeagueId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;

    const result = await createSponsorshipPackage({
      league_id: leagueId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      description: (fd.get("description") as string) || null,
      package_type: fd.get("package_type") as string,
      currency: "USD",
      price_cents: fd.get("price") ? Math.round(parseFloat(fd.get("price") as string) * 100) : null,
      benefits: ((fd.get("benefits") as string) || "").split("\n").map((s) => s.trim()).filter(Boolean),
      placement_options: {},
      visibility: fd.get("visibility") as string,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to create package");
    } else {
      router.push(`/cricket/leagues/${leagueSlug}/sponsors`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          League ID <span className="text-rose-400">*</span>
        </label>
        <input
          required
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
          placeholder="League UUID"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Package name <span className="text-rose-400">*</span></label>
        <input name="name" required maxLength={120} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" placeholder="Gold Sponsor 2025" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Package type <span className="text-rose-400">*</span></label>
        <select name="package_type" required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none">
          {PACKAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
        <textarea name="description" rows={3} maxLength={3000} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Price (USD, optional)</label>
        <input name="price" type="number" min={0} step="0.01" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" placeholder="Leave empty for inquiry-based pricing" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Benefits (one per line)</label>
        <textarea name="benefits" rows={5} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none" placeholder={"Logo on jersey\nBroadcast mention\nSocial media feature"} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Visibility</label>
        <select name="visibility" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none">
          <option value="private">Private (draft)</option>
          <option value="league">League members only</option>
          <option value="unlisted">Unlisted (link only)</option>
          <option value="public">Public</option>
        </select>
      </div>

      {error && <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
          {loading ? "Saving…" : "Create package"}
        </button>
      </div>
    </form>
  );
}
