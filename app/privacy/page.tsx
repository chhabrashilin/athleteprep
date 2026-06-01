import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Privacy Notice — GameIQ",
};

export default function PrivacyPage() {
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <div className="mb-8">
            <p className="text-xs font-medium text-amber-400 mb-2 uppercase tracking-wider">
              MVP Notice — Not a full legal policy
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-50 mb-3">
              Privacy Notice
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              GameIQ is an early-access MVP. This notice is honest about how we handle your data
              during this stage. It is not a lawyer-reviewed policy. We will update it as the
              product grows.
            </p>
          </div>

          <div className="prose prose-invert prose-slate max-w-none space-y-8 text-sm text-slate-300">
            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">What data we collect</h2>
              <ul className="space-y-2 text-slate-400 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Account information (email, password via Supabase Auth)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Team and roster data you enter</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Game notes, timestamps, and coach annotations you create</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Video files you upload (stored in Supabase private storage)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Access request and product feedback form responses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">How feedback is used</h2>
              <p className="text-slate-400 leading-relaxed">
                Access request and feedback responses are used to evaluate early product interest
                and prioritize which workflows we build next. They are read by the founding team
                only.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">What we do not do</h2>
              <ul className="space-y-2 text-slate-400 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not sell your data or feedback responses</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not share your roster or game data with third parties</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not use your video for AI model training without consent</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not send marketing emails (no email system is configured in v1)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Do not upload sensitive data in demo</h2>
              <p className="text-slate-400 leading-relaxed">
                Do not submit confidential player medical information, private health data, or
                sensitive personal data during the MVP demo. This platform is not currently
                certified for sensitive health or biometric data.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Data storage</h2>
              <p className="text-slate-400 leading-relaxed">
                Data is stored in Supabase (Postgres database and private storage). Row Level
                Security is enforced on all tables. Video files are stored in private buckets and
                served via time-limited signed URLs.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Contact</h2>
              <p className="text-slate-400 leading-relaxed">
                For data questions or deletion requests during the MVP, contact the founding team
                directly. A formal contact mechanism will be added as the product grows.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/60">
            <p className="text-xs text-slate-600">
              Last updated: 2026-06-01 — GameIQ MVP v1
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
