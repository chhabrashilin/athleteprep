import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Zap } from "lucide-react";

interface LandingHeroProps {
  isAuthenticated: boolean;
}

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 py-28 text-center">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-[700px] w-[700px] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-400">
          <Zap className="h-3.5 w-3.5" />
          Built for coaches who need faster, clearer, evidence-linked film review
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
          Turn game film into
          <br />
          <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
            coach-ready intelligence.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          GameIQ helps coaches turn match and practice video, tagged key moments, roster data, and
          notes into evidence-linked reports, player feedback, and next-practice plans.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/demo">
            <Button size="lg" className="min-w-40">
              Try Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/request-access">
            <Button variant="outline" size="lg" className="min-w-40">
              Request Access
            </Button>
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="min-w-40">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-600">
          GameIQ does not just store game film. It helps turn film into decisions.
        </p>
      </div>
    </section>
  );
}
