import Link from "next/link";
import { Zap, ArrowLeft, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SupportForm } from "@/components/support/SupportForm";

export const metadata = {
  title: "Support — GameIQ",
  description: "Submit a support request for the GameIQ pilot.",
};

export default function SupportPage() {
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
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <LifeBuoy className="h-6 w-6 text-sky-400" />
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">
                Support
              </h1>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Having trouble with GameIQ? Submit a request below and the founding team will review
              it. If you consented to contact, we&apos;ll follow up via email within 1–2 business days.
            </p>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              GameIQ is a pilot MVP operated by a small team. We do not have automated support — every
              request is read by a human. For data deletion or privacy questions, select the relevant
              issue type and we will handle it promptly.
            </p>
          </div>

          <SupportForm />

          <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-600">
            <span>GameIQ Pilot MVP</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Notice</Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/feedback" className="hover:text-slate-400 transition-colors">Product Feedback</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
