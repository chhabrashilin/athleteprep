import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-28 text-center">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-[600px] w-[600px] rounded-full bg-sky-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Tag */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-400">
          <Zap className="h-3.5 w-3.5" />
          AI-powered game review for serious teams
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
          Game film.
          <br />
          <span className="bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
            Coach-ready insights.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          GameIQ turns your game film, timestamps, and coach notes into structured insights,
          player reports, and next-practice plans — in minutes, not hours.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="min-w-40">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg" className="min-w-40">
              Create free account
            </Button>
          </Link>
        </div>

        {/* Social proof placeholder */}
        <p className="mt-8 text-sm text-slate-600">
          Built for coaches, analysts, and serious teams — not enterprise dashboards.
        </p>
      </div>
    </section>
  );
}
