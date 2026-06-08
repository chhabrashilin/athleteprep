import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckoutForm } from "./CheckoutForm";
import { getCommerceMode } from "@/lib/cricket/commerce/policy";

export const metadata: Metadata = { title: "Checkout — Cricket Store — GameIQ" };

export default function CheckoutPage() {
  const mode = getCommerceMode();

  return (
    <AppShell>
      <PageHeader
        title="Checkout"
        description="Submit your order request. A vendor will confirm availability and pricing."
      />
      <div className="max-w-lg">
        <CheckoutForm mode={mode} />
      </div>
    </AppShell>
  );
}
