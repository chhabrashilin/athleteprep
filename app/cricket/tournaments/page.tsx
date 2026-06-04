import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Cricket Tournaments — GameIQ" };

export default function CricketTournamentsPage() {
  return (
    <CricketPlaceholderPage
      title="Cricket Tournaments"
      description="Run multi-stage tournaments, group stages, and knockout brackets."
      comingSoonDescription="Tournament management — group stages, seeding, knockout brackets, and points progression — will be available in a future prompt. The database schema is already in place."
      status="foundation_ready"
      icon={<Layers className="h-6 w-6" />}
    />
  );
}
