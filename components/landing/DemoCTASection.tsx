import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, MessageSquare, Play } from "lucide-react";

interface DemoCTASectionProps {
  isAuthenticated?: boolean;
}

export function DemoCTASection({ isAuthenticated }: DemoCTASectionProps) {
  return (
    <section className="px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">
          See it in action
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Try the demo workspace — a full coaching report for a cricket match, ready in seconds.
          Or tell us about your team and we will reach out when early access opens.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/demo">
            <Button size="lg">
              <Play className="h-4 w-4" />
              Try Demo
            </Button>
          </Link>
          <Link href="/request-access">
            <Button variant="outline" size="lg">
              Request Access
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-6">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Already tried it? Share your feedback
          </Link>
        </div>
      </div>
    </section>
  );
}
