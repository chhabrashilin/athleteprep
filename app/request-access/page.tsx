import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RequestAccessForm } from "@/components/feedback/RequestAccessForm";

export const metadata = {
  title: "Request Access — GameIQ",
  description: "Tell us about your team and how you review game film. Early access is limited.",
};

export default function RequestAccessPage() {
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
              Request early access
            </h1>
            <p className="text-slate-400 leading-relaxed">
              Tell us about your team and your film review workflow. Your answers help us
              prioritize which workflows GameIQ builds first.
            </p>
          </div>

          <RequestAccessForm />
        </div>
      </main>
    </div>
  );
}
