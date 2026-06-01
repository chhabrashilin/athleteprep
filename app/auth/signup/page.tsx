import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create Account" };

export default async function SignupPage() {
  // If already authenticated, send to dashboard.
  const user = await getServerUser();
  if (user) redirect("/dashboard");

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start turning game film into coach-ready intelligence. No credit card required."
    >
      <SignupForm />
    </AuthCard>
  );
}
