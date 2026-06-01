import Link from "next/link";
import { CheckCircle, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeedbackSuccessStateProps {
  type: "access-request" | "product-feedback";
}

export function FeedbackSuccessState({ type }: FeedbackSuccessStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle className="h-8 w-8 text-emerald-400" />
      </div>

      {type === "access-request" ? (
        <>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">
            Thanks — we got your request.
          </h2>
          <p className="text-slate-400 max-w-md leading-relaxed mb-2">
            Your feedback helps shape which workflows GameIQ prioritizes first.
          </p>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-8">
            We will review early access requests manually. By submitting, you have agreed that we
            may use your responses to evaluate early product interest.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">
            Thanks for your feedback.
          </h2>
          <p className="text-slate-400 max-w-md leading-relaxed mb-2">
            This directly shapes which features GameIQ builds next.
          </p>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-8">
            Every response is read by the founding team. Your honest take — including what felt
            wrong — is the most valuable signal we can collect.
          </p>
        </>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/demo">
          <Button size="md">
            <Play className="h-4 w-4" />
            Try the Demo
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
