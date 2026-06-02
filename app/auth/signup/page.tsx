import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { getServerUser } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Create Account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  // If already authenticated, send to dashboard (or intended destination).
  const user = await getServerUser();
  if (user) {
    const { redirectTo } = await searchParams;
    redirect(safeRedirect(redirectTo));
  }

  const { redirectTo } = await searchParams;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start turning game film into coach-ready intelligence. No credit card required."
    >
      <SignupForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
