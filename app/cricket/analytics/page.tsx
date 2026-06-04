import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { isCricketAdvancedAnalyticsEnabled } from "@/lib/config/feature-flags";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Analytics — Cricket Hub — GameIQ" };

export default function CricketAnalyticsPage() {
  const enabled = isCricketAdvancedAnalyticsEnabled();

  return (
    <CricketPlaceholderPage
      title="Analytics"
      description="Wagon wheel, Manhattan graph, worm chart, run-rate trends, and player heatmaps."
      comingSoonDescription="Advanced cricket analytics — wagon wheel (shot placement), Manhattan graph (runs per over), worm chart (cumulative innings progression), and run-rate comparisons. Requires NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED=true."
      status="coming_soon"
      icon={<TrendingUp className="h-6 w-6" />}
      behindFlag={!enabled}
      flagName="NEXT_PUBLIC_CRICKET_ADVANCED_ANALYTICS_ENABLED"
    />
  );
}
