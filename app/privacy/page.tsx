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
              GameIQ is an early-access pilot MVP. This notice is honest about how we handle your
              data during this stage. It is not a lawyer-reviewed policy. We will update it as the
              product grows.
            </p>
          </div>

          <div className="space-y-8 text-sm text-slate-300">
            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">What data we collect</h2>
              <ul className="space-y-2 text-slate-400 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Account information (email and password via Supabase Auth — password is hashed, never stored in plaintext)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Team and roster data you enter (team name, player names, positions, jersey numbers)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Game notes, timestamps, and coach annotations you create</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Video files you upload (stored in private Supabase cloud storage — not publicly accessible)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> AI-generated reports and your verification/edit history</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Share links and export records</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Product usage events (anonymous events: what features were used, no personal text is captured)</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Access request and feedback form responses</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Support requests submitted via <Link href="/support" className="text-sky-400 hover:underline">/support</Link></li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">AI provider disclosure</h2>
              <p className="text-slate-400 leading-relaxed">
                When real AI is enabled (<code className="text-sky-400">AI_PROVIDER=openai</code>), your game notes,
                coach notes, opponent notes, and tagged event descriptions are sent to OpenAI&apos;s API
                to generate the coaching report. This data is transmitted over HTTPS. OpenAI&apos;s API
                usage policy governs how they process it — as of 2024, API data is not used to train
                OpenAI models by default (verify their current policy). Do not include sensitive
                medical or highly personal information in coach notes when real AI is enabled.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Mock AI mode (the default) does not send any data to external services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">How your data is used</h2>
              <ul className="space-y-2 text-slate-400 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Team and game data is used only to generate AI coaching reports for your team</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Feedback and access requests are read by the founding team to improve the product</li>
                <li className="flex items-start gap-2"><span className="text-sky-400 mt-1">→</span> Usage events are used to understand which features are being used (no personal text is captured in events)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">What we do not do</h2>
              <ul className="space-y-2 text-slate-400 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not sell your data or feedback responses</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not share your roster or game data with third parties (except the AI provider when real AI is enabled)</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not use your video for AI model training without consent</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not send marketing emails (no email system is configured in v1)</li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-1">✕</span> We do not make video files publicly accessible — video is served via time-limited signed URLs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Pilot data warnings</h2>
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-slate-400 leading-relaxed">
                  <strong className="text-amber-400">Adult athletes only.</strong> During this pilot,
                  please only use GameIQ with adult athletes (18+). We have not assessed compliance with
                  youth data protection laws (COPPA, GDPR for minors). If your team includes players under 18,
                  please do not upload their personal data during this pilot phase.
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">No sensitive health data.</strong> Do not submit
                  confidential player medical information, injury history, or biometric health data.
                  GameIQ is not certified for sensitive health or medical data.
                </div>
                <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Upload only content you have permission to use.</strong>{" "}
                  Only upload video and data that you have rights to use. GameIQ does not verify
                  content rights.
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Data storage and security</h2>
              <p className="text-slate-400 leading-relaxed">
                Data is stored in Supabase (PostgreSQL database and private object storage, hosted on AWS).
                Row Level Security is enforced on all database tables — data is scoped to your team workspace
                and only accessible by team members. Video files are stored in private buckets and served via
                time-limited signed URLs (1-hour expiry). Share links use 144-bit random tokens and can be
                revoked by the coach at any time.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Data deletion</h2>
              <p className="text-slate-400 leading-relaxed">
                You can request deletion of your account, team workspace, or any uploaded video at any time.
                The founding team will process deletion within 24 hours of receiving your request.
              </p>
              <p className="text-slate-400 leading-relaxed mt-2">
                To request deletion, submit a support request at{" "}
                <Link href="/support" className="text-sky-400 hover:underline">/support</Link>{" "}
                and select <strong className="text-slate-300">&quot;Data deletion request&quot;</strong> as the issue type.
                Include your team name and email address.
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Self-serve data deletion is planned for a future release. Manual deletion is performed
                by the founding team via the database administration dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-100 mb-3">Contact and support</h2>
              <p className="text-slate-400 leading-relaxed">
                For data questions, deletion requests, or privacy concerns during the pilot, use the
                support form at <Link href="/support" className="text-sky-400 hover:underline">/support</Link>.
                Select the relevant issue type and the founding team will respond within 1–2 business days.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-xs text-slate-600">
              Last updated: 2026-06-01 — GameIQ Pilot MVP v1
            </p>
            <span className="hidden sm:inline text-slate-700">·</span>
            <Link href="/support" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              Submit a support request
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
