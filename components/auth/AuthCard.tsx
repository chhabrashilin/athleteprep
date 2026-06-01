import Link from "next/link";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 py-20">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-100">GameIQ</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-xl font-bold text-slate-100">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Back to GameIQ
          </Link>
        </p>
      </div>
    </div>
  );
}
