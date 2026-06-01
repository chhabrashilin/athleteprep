import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  // If already authenticated, send to dashboard (or intended destination).
  const user = await getServerUser();
  if (user) {
    const { redirectTo } = await searchParams;
    const destination =
      redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard";
    redirect(destination);
  }

  const { redirectTo } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to review game film, generate coaching insights, and prepare your next practice."
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
