import type { Metadata } from "next";
import { Tv } from "lucide-react";
import { isCricketStreamingEnabled } from "@/lib/config/feature-flags";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Streaming — Cricket Hub — GameIQ" };

export default function CricketStreamingPage() {
  const enabled = isCricketStreamingEnabled();

  return (
    <CricketPlaceholderPage
      title="Streaming"
      description="Live streaming overlays, score tickers, and broadcast-quality graphics."
      comingSoonDescription="GameIQ streaming tools will produce broadcast-quality score overlays, lower-thirds, scoreboard widgets, and graphic packs that integrate with OBS and other streaming platforms. Requires NEXT_PUBLIC_CRICKET_STREAMING_ENABLED=true."
      status="coming_soon"
      icon={<Tv className="h-6 w-6" />}
      behindFlag={!enabled}
      flagName="NEXT_PUBLIC_CRICKET_STREAMING_ENABLED"
    />
  );
}
