import Link from "next/link";
import type { CricketVendor } from "@/lib/cricket/commerce/vendors/queries";

interface Props {
  vendor: Pick<CricketVendor, "name" | "slug" | "vendorType" | "logoUrl">;
  linkable?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  equipment:          "Equipment",
  apparel:            "Apparel",
  team_kits:          "Team Kits",
  coaching_services:  "Coaching",
  ground_services:    "Ground Services",
  photography:        "Photography",
  streaming_services: "Streaming",
  sponsor:            "Sponsor",
  other:              "Other",
};

export function CricketVendorBadge({ vendor, linkable = true }: Props) {
  const content = (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 overflow-hidden shrink-0">
        {vendor.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          vendor.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-300 truncate">{vendor.name}</p>
        <p className="text-xs text-slate-500">{TYPE_LABELS[vendor.vendorType] ?? vendor.vendorType}</p>
      </div>
    </div>
  );

  if (linkable) {
    return (
      <Link href={`/cricket/store/vendors/${vendor.slug}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
