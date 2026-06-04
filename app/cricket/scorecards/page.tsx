import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Scorecards — Cricket Hub — GameIQ" };

export default function CricketScorecardsPage() {
  return (
    <CricketPlaceholderPage
      title="Scorecards"
      description="Complete innings scorecards with batting, bowling, and fall-of-wickets."
      comingSoonDescription="Full ball-by-ball innings scorecards — batsmen, partnerships, bowling figures, extras, and fall-of-wickets — will be available once the live scoring module ships."
      status="coming_soon"
      icon={<FileText className="h-6 w-6" />}
    />
  );
}
