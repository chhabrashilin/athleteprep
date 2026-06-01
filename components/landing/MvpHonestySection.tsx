import { Info } from "lucide-react";

export function MvpHonestySection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">
                What GameIQ is — and what it is not yet
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                GameIQ&apos;s first MVP uses uploaded video, coach notes, roster data, and manually
                tagged key moments. Analysis is grounded in what coaches tag — not automated
                frame-by-frame video parsing.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Full automated player tracking and ball-tracking computer vision is on the roadmap
                as the platform grows. For now, structured manual tagging gives coaches 90% of the
                value at a fraction of the infrastructure cost — and it is honest about what it
                knows.
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Evidence-linked insights from your tagged events
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Player feedback grounded in real named moments
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  Confidence scores and assumptions section every time
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                  Automated frame analysis — roadmap, not v1
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                  Player/ball tracking — roadmap, not v1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
