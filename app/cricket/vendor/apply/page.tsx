import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { VendorApplyForm } from "./VendorApplyForm";

export const metadata: Metadata = { title: "Apply as a Vendor — GameIQ" };

export default function VendorApplyPage() {
  return (
    <AppShell>
      <PageHeader
        title="Apply as a Vendor"
        description="Submit your vendor application. Applications are reviewed by league admins before going public."
      />
      <VendorApplyForm />
    </AppShell>
  );
}
