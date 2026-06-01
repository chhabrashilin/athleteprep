import Link from "next/link";
import { Zap, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LandingHero } from "@/components/landing/LandingHero";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ReportFeaturesSection } from "@/components/landing/ReportFeaturesSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { MvpHonestySection } from "@/components/landing/MvpHonestySection";
import { DemoCTASection } from "@/components/landing/DemoCTASection";
import { getServerUser } from "@/lib/supabase/server";

export default async function LandingPage() {
  const user = await getServerUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-full bg-slate-950">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-100">GameIQ</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" size="sm">Demo</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/request-access">
                  <Button size="sm">
                    Request Access
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <LandingHero isAuthenticated={isAuthenticated} />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <ProblemSection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <HowItWorksSection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <ReportFeaturesSection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <TrustSection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <MvpHonestySection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />
        <DemoCTASection isAuthenticated={isAuthenticated} />

        {/* Footer */}
        <footer className="border-t border-slate-800 px-6 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-sky-500">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">GameIQ</span>
                </div>
                <p className="text-xs text-slate-500 max-w-xs">
                  AI game review for serious teams. Turn film into coach-ready intelligence.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <Link href="/auth/login" className="hover:text-slate-300 transition-colors">Login</Link>
                <Link href="/request-access" className="hover:text-slate-300 transition-colors">Request Access</Link>
                <Link href="/demo" className="hover:text-slate-300 transition-colors">Demo</Link>
                <Link href="/feedback" className="hover:text-slate-300 transition-colors">Feedback</Link>
                <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-800/60 pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} GameIQ. MVP — early access.
              </p>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                Have feedback on GameIQ?
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
