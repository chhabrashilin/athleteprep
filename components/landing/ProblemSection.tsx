import { Clock, MessageSquare, HardDrive, Users } from "lucide-react";

const PROBLEMS = [
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Too much film, not enough time",
    description:
      "Most coaches spend 2–4 hours cutting film after every game. That time comes out of recovery, planning, and sleep — not from a surplus.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Players get vague feedback",
    description:
      "\"Work on your positioning\" is not coaching. Players need specific, evidence-linked moments from real game footage — and most teams cannot deliver that consistently.",
  },
  {
    icon: <HardDrive className="h-5 w-5" />,
    title: "Tools that store video but do not produce decisions",
    description:
      "Existing platforms archive your footage well. What they do not produce is a coaching report — structured insights, player feedback, and a practice plan — ready in minutes.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Teams without analysts are underserved",
    description:
      "Professional teams have video analysts. High school, college, and competitive club teams do not. GameIQ gives every coaching staff an analyst-grade workflow.",
  },
];

export function ProblemSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            The problem every coach already knows
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Film review has not changed much in 30 years. GameIQ changes what is possible in the
            time coaches actually have.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                {p.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
