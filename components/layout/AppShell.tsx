import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { getServerUser } from "@/lib/supabase/server";

export interface TeamContext {
  teamId: string;
  teamName: string;
}

interface AppShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  teamContext?: TeamContext;
}

/**
 * Server Component — fetches the current user and passes auth + team context
 * to the sidebar and header. Team pages provide teamContext so the sidebar
 * can show team-scoped navigation links.
 */
export async function AppShell({
  children,
  headerTitle,
  teamContext,
}: AppShellProps) {
  const user = await getServerUser();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AppSidebar user={user} teamContext={teamContext} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title={headerTitle ?? teamContext?.teamName} user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
