import Link from "next/link";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { Button } from "@/components/ui/Button";
import { Upload, Tag, FileText, Zap, ArrowRight } from "lucide-react";
import { getServerUser } from "@/lib/supabase/server";

const WORKFLOW_STEPS = [
  {
    step: "01",
    icon: <Upload className="h-6 w-6" />,
    title: "Upload game film",
    description:
      "Upload your match or practice video. Add metadata — sport, date, opponent, score, venue, and competition context.",
  },
  {
    step: "02",
    icon: <Tag className="h-6 w-6" />,
    title: "Add context and key moments",
    description:
      "Tag key events with timestamps and player involvement. Add coach observations and opponent notes. The more you add, the better the analysis.",
  },
  {
    step: "03",
    icon: <FileText className="h-6 w-6" />,
    title: "Generate your report",
    description:
      "AI analyzes your inputs and generates coaching insights, player reports, and practice recommendations — each with evidence and confidence scores.",
  },
];

export default async function LandingPage() {
  const user = await getServerUser();

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
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">
                  Go to dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero */}
        <HeroSection />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />

        {/* How it works */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-slate-100">
                From upload to insights in three steps
              </h2>
              <p className="mt-3 text-slate-400">
                No complex setup. No manual report building. Just structured analysis your team can act on.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {WORKFLOW_STEPS.map((step) => (
                <div key={step.step} className="rounded-xl border border-slate-800 bg-slate-900 p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                      {step.icon}
                    </div>
                    <span className="text-3xl font-bold text-slate-800">{step.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />

        {/* Feature grid */}
        <FeatureGrid />

        <div className="mx-auto max-w-5xl border-t border-slate-800/60 px-6" />

        {/* CTA */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">
              Ready to cut film review time in half?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              GameIQ is built for coaches who want better insights, not more dashboards.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/signup">
                <Button size="lg">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Explore the dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 px-6 py-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-sky-500">
                <Zap className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-300">GameIQ</span>
            </div>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} GameIQ. AI game review for serious teams.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
