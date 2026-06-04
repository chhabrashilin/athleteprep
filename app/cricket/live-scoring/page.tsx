import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { isCricketLiveScoringEnabled } from "@/lib/config/feature-flags";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Live Scoring — Cricket Hub — GameIQ" };

export default function CricketLiveScoringPage() {
  const enabled = isCricketLiveScoringEnabled();

  return (
    <CricketPlaceholderPage
      title="Live Scoring"
      description="Ball-by-ball scoring with real-time updates and over-by-over commentary."
      comingSoonDescription="The live scoring interface will support ball-by-ball input, run tracking, wicket recording, extras, and live broadcast feed output. Requires NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED=true."
      status="coming_soon"
      icon={<Radio className="h-6 w-6" />}
      behindFlag={!enabled}
      flagName="NEXT_PUBLIC_CRICKET_LIVE_SCORING_ENABLED"
    />
  );
}
