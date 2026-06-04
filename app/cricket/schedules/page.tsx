import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { CricketPlaceholderPage } from "@/components/cricket/CricketPlaceholderPage";

export const metadata: Metadata = { title: "Cricket Schedules — GameIQ" };

export default function CricketSchedulesPage() {
  return (
    <CricketPlaceholderPage
      title="Cricket Schedules"
      description="Full season schedules, upcoming fixtures, and calendar view."
      comingSoonDescription="Scheduled matches are already stored in the database. The calendar UI — week view, month view, and fixture list — will be built in a future prompt."
      status="foundation_ready"
      icon={<Clock className="h-6 w-6" />}
    />
  );
}
