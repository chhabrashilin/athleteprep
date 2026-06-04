import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Points Table — Cricket Hub — GameIQ" };

export default function CricketPointsTablePage() {
  return (
    <CricketPlaceholderPage
      title="Points Table"
      description="Live league standings with net run rate, wins, losses, and points."
      comingSoonDescription="The points table will auto-calculate standings from completed match results, including net run rate, wins, losses, ties, and no-results. Available once match result recording is live."
      status="coming_soon"
      icon={<BarChart3 className="h-6 w-6" />}
    />
  );
}
