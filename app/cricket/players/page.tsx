import type { Metadata } from "next";
import { Users } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Cricket Players — GameIQ" };

export default function CricketPlayersPage() {
  return (
    <CricketPlaceholderPage
      title="Cricket Players"
      description="Cricket player profiles, batting/bowling styles, and career statistics."
      comingSoonDescription="The players module will support creating profiles with batting style, bowling style, fielding position, stats, and match history. The database schema including team rosters is already in place."
      status="foundation_ready"
      icon={<Users className="h-6 w-6" />}
    />
  );
}
