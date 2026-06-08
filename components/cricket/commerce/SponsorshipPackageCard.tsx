import type { SponsorshipPackage } from "@/lib/cricket/commerce/sponsorship/actions";

interface Props {
  pkg: SponsorshipPackage;
  onInquire?: () => void;
}

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  league: "League Sponsorship",
  team: "Team Sponsorship",
  match: "Match Sponsorship",
  broadcast: "Broadcast Sponsorship",
  overlay: "Overlay Sponsorship",
  jersey: "Jersey Sponsorship",
  ground: "Ground Sponsorship",
  digital: "Digital Sponsorship",
  custom: "Custom Package",
};

export function SponsorshipPackageCard({ pkg, onInquire }: Props) {
  const priceDisplay =
    pkg.priceCents != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: pkg.currency,
          minimumFractionDigits: 0,
        }).format(pkg.priceCents / 100)
      : "Contact for pricing";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">
              {PACKAGE_TYPE_LABELS[pkg.packageType] ?? pkg.packageType}
            </p>
            <h3 className="text-base font-semibold text-slate-100">{pkg.name}</h3>
          </div>
          <p className="text-lg font-bold text-sky-400 whitespace-nowrap shrink-0">
            {priceDisplay}
          </p>
        </div>
        {pkg.description && (
          <p className="text-sm text-slate-400 mt-2">{pkg.description}</p>
        )}
      </div>

      {/* Benefits */}
      {pkg.benefits.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-800">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Included benefits
          </p>
          <ul className="space-y-1.5">
            {pkg.benefits.slice(0, 6).map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">✓</span>
                {benefit}
              </li>
            ))}
            {pkg.benefits.length > 6 && (
              <li className="text-xs text-slate-500">
                +{pkg.benefits.length - 6} more benefits
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Dates */}
      {(pkg.startDate || pkg.endDate) && (
        <div className="px-5 py-3 border-b border-slate-800 text-xs text-slate-500">
          {pkg.startDate && <span>From {pkg.startDate}</span>}
          {pkg.startDate && pkg.endDate && <span className="mx-1">→</span>}
          {pkg.endDate && <span>Until {pkg.endDate}</span>}
        </div>
      )}

      {/* CTA */}
      <div className="px-5 py-4">
        <button
          onClick={onInquire}
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
        >
          Inquire about this package
        </button>
      </div>
    </div>
  );
}
