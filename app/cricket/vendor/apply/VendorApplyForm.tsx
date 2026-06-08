"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCricketVendor } from "@/lib/cricket/commerce/vendors/actions";
import { generateVendorSlug } from "@/lib/cricket/validation/vendors";

const VENDOR_TYPES = [
  { value: "equipment",          label: "Cricket Equipment"      },
  { value: "apparel",            label: "Apparel & Clothing"     },
  { value: "team_kits",          label: "Team Kits"              },
  { value: "coaching_services",  label: "Coaching Services"      },
  { value: "ground_services",    label: "Ground & Venue Services" },
  { value: "photography",        label: "Photography & Video"    },
  { value: "streaming_services", label: "Streaming Services"     },
  { value: "sponsor",            label: "Sponsorship"            },
  { value: "other",              label: "Other"                  },
] as const;

export function VendorApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const result = await createCricketVendor({
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      description: (fd.get("description") as string) || null,
      website_url: (fd.get("website_url") as string) || null,
      contact_name: fd.get("contact_name") as string,
      contact_email: fd.get("contact_email") as string,
      contact_phone: (fd.get("contact_phone") as string) || null,
      city: (fd.get("city") as string) || null,
      country: (fd.get("country") as string) || null,
      vendor_type: fd.get("vendor_type") as string,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to submit application");
    } else {
      router.push("/cricket/vendor");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Business name <span className="text-rose-400">*</span>
          </label>
          <input
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            placeholder="Madison Cricket Supplies"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            URL slug <span className="text-rose-400">*</span>
          </label>
          <input
            name="slug"
            required
            maxLength={80}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            defaultValue={generateVendorSlug(name)}
            key={name}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none font-mono"
            placeholder="madison-cricket-supplies"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Vendor type <span className="text-rose-400">*</span>
        </label>
        <select
          name="vendor_type"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          {VENDOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none resize-none"
          placeholder="Brief description of your business and what you offer…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Contact name <span className="text-rose-400">*</span>
          </label>
          <input name="contact_name" required maxLength={200} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Contact email <span className="text-rose-400">*</span>
          </label>
          <input name="contact_email" type="email" required className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Phone (optional)</label>
          <input name="contact_phone" type="tel" maxLength={30} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Website (optional)</label>
          <input name="website_url" type="url" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" placeholder="https://" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
          <input name="city" maxLength={100} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Country</label>
          <input name="country" maxLength={100} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button type="submit" disabled={loading} className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors">
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
