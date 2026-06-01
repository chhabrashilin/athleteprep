import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Zap, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Authentication Error" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const errorMessage =
    message ?? "An unexpected authentication error occurred. Please try again.";

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 py-20">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100">GameIQ</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-red-900/40 bg-slate-900 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          <h1 className="text-xl font-bold text-slate-100">Authentication failed</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">{errorMessage}</p>

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/auth/login">
              <Button className="w-full">Try signing in again</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
