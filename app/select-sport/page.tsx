import type { Metadata } from "next";
import { Zap } from "lucide-react";
import Link from "next/link";
import { getAllSports } from "@/lib/sports/registry";
import { SportSelectionGrid } from "./SportSelectionGrid";

export const metadata: Metadata = { title: "Choose Your Sport — GameIQ" };

export default function SelectSportPage() {
  const allSports = getAllSports();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-100">GameIQ</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Skip to dashboard →
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Choose your sport
            </h1>
            <p className="mt-3 text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              GameIQ adapts to the way your sport is played, scored, coached, and analyzed.
            </p>
          </div>

          <SportSelectionGrid sports={allSports} />

          <p className="mt-8 text-center text-xs text-slate-600">
            You can change this later from settings.
          </p>
        </div>
      </main>
    </div>
  );
}
