import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewSponsorshipPackageForm } from "./NewSponsorshipPackageForm";

export const metadata: Metadata = { title: "New Sponsorship Package — GameIQ" };

interface Props { params: Promise<{ slug: string }> }

export default async function NewSponsorshipPackagePage({ params }: Props) {
  const { slug } = await params;

  return (
    <AppShell>
      <PageHeader title="New Sponsorship Package" description="Create a sponsorship package for your league." />
      <NewSponsorshipPackageForm leagueSlug={slug} />
    </AppShell>
  );
}
