"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/auth/redirect";

type ConfirmState =
  | { status: "checking" }
  | { status: "failed"; message: string };

function ConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = getSupabaseBrowserClient();

  // Initialise synchronously so the effect body never calls setState directly.
  const [state, setState] = useState<ConfirmState>(
    supabase
      ? { status: "checking" }
      : {
          status: "failed",
          message: "Authentication service is not configured.",
        }
  );

  useEffect(() => {
    if (!supabase) return;

    const next = safeRedirect(searchParams.get("next"));

    // getSession() processes any #access_token hash fragment automatically
    // when the Supabase browser client initialises in the browser.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setState({
          status: "failed",
          message:
            "We could not confirm your account. The link may have expired or already been used — please sign up again or sign in.",
        });
        return;
      }
      router.replace(next);
    });
  }, [router, searchParams, supabase]);

  if (state.status === "failed") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 py-20">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            GameIQ
          </span>
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-red-900/40 bg-slate-900 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">
            Confirmation failed
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {state.message}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/auth/signup">
              <Button className="w-full">Sign up again</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950">
      <div className="flex items-center gap-3 text-slate-400 text-sm">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        Confirming your account…
      </div>
    </div>
  );
}

const Spinner = (
  <div className="flex min-h-full flex-col items-center justify-center bg-slate-950">
    <div className="flex items-center gap-3 text-slate-400 text-sm">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      Confirming your account…
    </div>
  </div>
);

export default function AuthConfirmPage() {
  return <Suspense fallback={Spinner}><ConfirmInner /></Suspense>;
}
