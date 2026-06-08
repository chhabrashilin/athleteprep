"use client";

import { useState } from "react";
import { createSponsorshipInquiry } from "@/lib/cricket/commerce/sponsorship/actions";

interface Props {
  leagueId: string;
  packageId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SponsorshipInquiryForm({ leagueId, packageId, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const result = await createSponsorshipInquiry({
      league_id: leagueId,
      package_id: packageId ?? null,
      company_name: fd.get("company_name") as string,
      contact_name: fd.get("contact_name") as string,
      contact_email: fd.get("contact_email") as string,
      contact_phone: (fd.get("contact_phone") as string) || null,
      message: (fd.get("message") as string) || null,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to submit inquiry");
    } else {
      setSuccess(true);
      onSuccess?.();
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-base font-semibold text-emerald-400 mb-1">Inquiry submitted!</h3>
        <p className="text-sm text-slate-400">
          We&apos;ve received your sponsorship inquiry. A member of the league team will be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Company name <span className="text-rose-400">*</span>
          </label>
          <input
            name="company_name"
            required
            maxLength={200}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="Acme Corp"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Contact name <span className="text-rose-400">*</span>
          </label>
          <input
            name="contact_name"
            required
            maxLength={200}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="Jane Smith"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Email <span className="text-rose-400">*</span>
          </label>
          <input
            name="contact_email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Phone (optional)</label>
          <input
            name="contact_phone"
            type="tel"
            maxLength={30}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Message (optional)</label>
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none"
          placeholder="Tell us about your company and what you're looking for..."
        />
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting…" : "Submit inquiry"}
        </button>
      </div>
    </form>
  );
}
