import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getServerUser } from "@/lib/supabase/server";
import { getUserCricketNotifications } from "@/lib/cricket/notifications/queries";
import { CricketNotificationList } from "@/components/cricket/CricketNotificationList";
import { isCricketInAppNotificationsEnabled } from "@/lib/config/feature-flags";
import { CricketEmptyState } from "@/components/cricket/CricketEmptyState";

export const metadata: Metadata = { title: "Notifications — GameIQ" };

export default async function CricketNotificationsPage() {
  if (!isCricketInAppNotificationsEnabled()) {
    return (
      <AppShell>
        <CricketEmptyState
          title="Notifications coming soon"
          description="In-app notifications are not yet enabled on this deployment."
          backHref="/cricket"
          backLabel="Back to Cricket Hub"
        />
      </AppShell>
    );
  }

  const user = await getServerUser();
  if (!user) redirect("/login");

  const notifications = await getUserCricketNotifications(user.id, { limit: 50 });

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        description="Your recent cricket activity and updates."
      />

      <div className="mb-4 flex items-center gap-3 text-sm">
        <Link href="/cricket" className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Cricket Hub
        </Link>
      </div>

      <CricketNotificationList notifications={notifications} />
    </AppShell>
  );
}
