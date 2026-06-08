import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewProductForm } from "./NewProductForm";

export const metadata: Metadata = { title: "New Product — GameIQ" };

export default function NewProductPage() {
  return (
    <AppShell>
      <PageHeader title="New Product" description="Create a new product listing for your vendor store." />
      <div className="max-w-xl">
        <NewProductForm />
      </div>
    </AppShell>
  );
}
