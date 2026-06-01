import Link from "next/link";
import { Zap, Play, ArrowRight, Tag, FileText, Upload, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerUser } from "@/lib/supabase/server";

const DEMO_INCLUDES = [
  "Cricket team — Madison Cricket XI",
  "10-player roster with positions and jersey numbers",
  "A full match: Madison Cricket XI vs Lakeside CC",
  "12 manually tagged key moments — batting, bowling, fielding, opponent tendencies",
  "An AI-generated coaching report with all 6 sections",
  "Evidence-linked insights with confidence scores",
  "Player-by-player feedback for tagged players",
  "Opponent tendency analysis and recommended responses",
  "A next-practice plan with specific drills",
  "Assumptions and limitations section",
];

const WHAT_TO_LOOK_FOR = [
  { icon: <CheckCircle className="h-4 w-4" />, text: "How evidence references connect back to specific tagged events" },
  { icon: <CheckCircle className="h-4 w-4" />, text: "Confidence scores on each insight — High, Medium, or Low" },
  { icon: <CheckCircle className="h-4 w-4" />, text: "The assumptions section — what the AI flagged as uncertain" },
  { icon: <CheckCircle className="h-4 w-4" />, text: "Player feedback depth vs. what you get from traditional review" },
  { icon: <CheckCircle className="h-4 w-4" />, text: "How the coach verification workflow feels" },
];

export default async function DemoPage() {
  const user = await getServerUser();

  return (
    <div className="min-h-full bg-slate-950">
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
                  <Button size="sm">Request Access</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <div className="mx-auto max-w-4xl px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-400">
              <Play className="h-3.5 w-3.5" />
              Interactive demo
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl mb-4">
              The GameIQ Demo
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A complete coaching report — built from a real demo team, real roster, and 12 tagged
              key moments. Ready to explore in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-10">
            {/* What's included */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-400" />
                What the demo includes
              </h2>
              <ul className="space-y-2">
                {DEMO_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What to look for */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-400" />
                What to look for
              </h2>
              <ul className="space-y-3">
                {WHAT_TO_LOOK_FOR.map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="mt-0.5 text-emerald-400 shrink-0">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How demo tagging works */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-400" />
              How the real workflow works
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              In real use, a coach or analyst tags key moments while reviewing film — each with a
              timestamp, player, label, and description. This takes 10–15 minutes for a match. The
              demo creates this data automatically so you can go straight to the report.
            </p>
            <p className="text-sm text-slate-500 leading-relaxed">
              The AI then reasons over those tagged events to produce insights, player feedback, and
              a practice plan. Every claim is grounded in a specific event you tagged — nothing is
              fabricated.
            </p>
          </div>

          {/* Honesty notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-10">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300 mb-1">What this demo does not include</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This demo uses mock AI output — evidence-linked and data-driven, but not from a
                  live OpenAI or Anthropic call. For production use, the platform supports real AI
                  providers. Automated player/ball tracking is not in v1 — analysis is based on
                  manually tagged timestamps.
                </p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 text-center">
            <h3 className="text-xl font-bold text-slate-100">Ready to explore?</h3>
            <p className="text-slate-400 text-sm max-w-md">
              {user
                ? "Set up the demo workspace and you will be taken straight to the report."
                : "Sign in or create an account, then set up the demo workspace."}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {user ? (
                <Link href="/demo/setup">
                  <Button size="lg">
                    <Play className="h-4 w-4" />
                    Set Up Demo Workspace
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg">
                    <Play className="h-4 w-4" />
                    Create Account to Try Demo
                  </Button>
                </Link>
              )}
              {user && (
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link href="/request-access">
                <Button variant="ghost" size="lg">
                  Request Early Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
