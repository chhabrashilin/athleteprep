import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TeamCard } from "@/components/teams/TeamCard";
import { TeamEmptyState } from "@/components/teams/TeamEmptyState";
import { Plus } from "lucide-react";
import { getTeamsWithMembershipForCurrentUser } from "@/lib/db/teams";

export const metadata: Metadata = { title: "Teams — GameIQ" };

export default async function TeamsPage() {
  const teamsWithMembership = await getTeamsWithMembershipForCurrentUser();

  return (
    <AppShell>
      <PageHeader
        title="Teams"
        description="Manage your team workspaces."
        action={
          <Link href="/teams/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New team
            </Button>
          </Link>
        }
      />

      {teamsWithMembership.length === 0 ? (
        <TeamEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamsWithMembership.map(({ team, membership }) => (
            <TeamCard key={team.id} team={team} membership={membership} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
