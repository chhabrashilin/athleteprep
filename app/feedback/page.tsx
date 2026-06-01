import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductFeedbackForm } from "@/components/feedback/ProductFeedbackForm";

export const metadata = {
  title: "Feedback — GameIQ",
  description: "Share your honest reaction to GameIQ after trying the demo.",
};

export default function FeedbackPage() {
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-50 mb-3">
              Share your feedback
            </h1>
            <p className="text-slate-400 leading-relaxed">
              Tried the demo? Your honest reaction — including what felt wrong or unnecessary — is
              the most valuable signal we can collect. Every response is read by the founding team.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Fields marked with <span className="text-red-400">*</span> are required. Everything
              else is optional.
            </p>
          </div>

          <ProductFeedbackForm />
        </div>
      </main>
    </div>
  );
}
