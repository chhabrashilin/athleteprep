import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { isCricketMarketplaceEnabled } from "@/lib/config/feature-flags";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Store — Cricket Hub — GameIQ" };

export default function CricketStorePage() {
  const enabled = isCricketMarketplaceEnabled();

  return (
    <CricketPlaceholderPage
      title="Store"
      description="Cricket equipment, merchandise, and gear listings."
      comingSoonDescription="The cricket store will list bats, protective equipment, apparel, and team merchandise. Requires NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED=true."
      status="coming_soon"
      icon={<ShoppingBag className="h-6 w-6" />}
      behindFlag={!enabled}
      flagName="NEXT_PUBLIC_CRICKET_MARKETPLACE_ENABLED"
    />
  );
}
