"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCricketVenue } from "@/app/actions/cricket-venues";
import { VENUE_TYPES } from "@/lib/cricket/validation/venue";

export function CreateVenueForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const input = {
      name: form.get("name") as string,
      city: form.get("city") as string,
      country: form.get("country") as string,
      shortName: (form.get("shortName") as string) || undefined,
      venueType: (form.get("venueType") as string) || "ground",
      address: (form.get("address") as string) || undefined,
      region: (form.get("region") as string) || undefined,
      capacity: form.get("capacity") ? Number(form.get("capacity")) : undefined,
      timezone: (form.get("timezone") as string) || "America/New_York",
      contactName: (form.get("contactName") as string) || undefined,
      contactEmail: (form.get("contactEmail") as string) || undefined,
      contactPhone: (form.get("contactPhone") as string) || undefined,
      bookingNotes: (form.get("bookingNotes") as string) || undefined,
      hasLights: form.get("hasLights") === "on",
      hasTurfPitch: form.get("hasTurfPitch") === "on",
      hasMattingPitch: form.get("hasMattingPitch") === "on",
      hasPracticeNets: form.get("hasPracticeNets") === "on",
      hasChangingRooms: form.get("hasChangingRooms") === "on",
      hasParking: form.get("hasParking") === "on",
    };

    const result = await createCricketVenue(input);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/cricket/venues/${result.data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Basic Details */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Basic Details</legend>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Venue Name *</label>
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Madison Cricket Ground"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Short Name</label>
            <input
              name="shortName"
              maxLength={30}
              placeholder="e.g. MCG"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Venue Type</label>
            <select
              name="venueType"
              defaultValue="ground"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Location */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Location</legend>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Address</label>
          <input
            name="address"
            maxLength={300}
            placeholder="Street address"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">City *</label>
            <input
              name="city"
              required
              placeholder="e.g. Madison"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Region / State</label>
            <input
              name="region"
              placeholder="e.g. Wisconsin"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Country *</label>
          <input
            name="country"
            required
            defaultValue="USA"
            placeholder="e.g. USA"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Contact</legend>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Name</label>
          <input
            name="contactName"
            maxLength={120}
            placeholder="Ground manager name"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              name="contactEmail"
              type="email"
              placeholder="email@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone</label>
            <input
              name="contactPhone"
              type="tel"
              placeholder="+1 555 000 0000"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* Facilities */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <legend className="text-sm font-semibold text-slate-300 px-1">Facilities</legend>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Capacity</label>
          <input
            name="capacity"
            type="number"
            min="1"
            placeholder="e.g. 500"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            { name: "hasLights", label: "Floodlights" },
            { name: "hasTurfPitch", label: "Turf Pitch" },
            { name: "hasMattingPitch", label: "Matting Pitch" },
            { name: "hasPracticeNets", label: "Practice Nets" },
            { name: "hasChangingRooms", label: "Changing Rooms" },
            { name: "hasParking", label: "Parking" },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name={name}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Booking Notes */}
      <fieldset className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <legend className="text-sm font-semibold text-slate-300 px-1">Notes</legend>
        <textarea
          name="bookingNotes"
          rows={3}
          maxLength={2000}
          placeholder="Booking instructions, access notes, special requirements…"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none resize-none"
        />
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Creating venue…" : "Create Venue"}
      </button>
    </form>
  );
}
