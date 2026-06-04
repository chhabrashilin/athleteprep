import Link from "next/link";
import { MapPin, Lightbulb, Car, Wifi } from "lucide-react";
import type { CricketVenueFull } from "@/lib/cricket/types";

interface VenueCardProps {
  venue: CricketVenueFull;
  showActions?: boolean;
  canEdit?: boolean;
}

export function VenueCard({ venue, showActions = false, canEdit = false }: VenueCardProps) {
  const amenities: Array<{ label: string; active: boolean; icon: React.ReactNode }> = [
    { label: "Lights", active: venue.hasLights, icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Turf pitch", active: venue.hasTurfPitch, icon: null },
    { label: "Matting", active: venue.hasMattingPitch, icon: null },
    { label: "Nets", active: venue.hasPracticeNets, icon: <Wifi className="h-3 w-3" /> },
    { label: "Parking", active: venue.hasParking, icon: <Car className="h-3 w-3" /> },
  ];

  const activeAmenities = amenities.filter((a) => a.active);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/cricket/venues/${venue.slug ?? venue.id}`}
            className="text-sm font-semibold text-slate-100 hover:text-sky-400 transition-colors"
          >
            {venue.name}
          </Link>
          {venue.shortName && (
            <span className="ml-2 text-xs text-slate-500">({venue.shortName})</span>
          )}
          {venue.city && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-400">
                {[venue.city, venue.region, venue.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              venue.isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-700/50 text-slate-500"
            }`}
          >
            {venue.isActive ? "Active" : "Inactive"}
          </span>
          <span className="text-xs text-slate-500 capitalize">{venue.venueType.replace("_", " ")}</span>
        </div>
      </div>

      {activeAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeAmenities.map((a) => (
            <span
              key={a.label}
              className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400"
            >
              {a.icon}
              {a.label}
            </span>
          ))}
        </div>
      )}

      {venue.capacity && (
        <p className="text-xs text-slate-500">Capacity: {venue.capacity.toLocaleString()}</p>
      )}

      {showActions && canEdit && venue.slug && (
        <div className="mt-auto pt-2 border-t border-slate-800">
          <Link
            href={`/cricket/venues/${venue.slug}/settings`}
            className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
          >
            Edit venue →
          </Link>
        </div>
      )}
    </div>
  );
}
