import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Cricket Matches — GameIQ" };

export default function CricketMatchesPage() {
  return (
    <CricketPlaceholderPage
      title="Cricket Matches"
      description="Schedule and manage matches between teams with venue and toss details."
      comingSoonDescription="The matches module supports creating fixtures with home/away teams, venue, overs format, toss recording, and result entry. The database schema is already in place."
      status="foundation_ready"
      icon={<Calendar className="h-6 w-6" />}
    />
  );
}
