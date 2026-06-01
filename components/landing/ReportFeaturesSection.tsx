import {
  BrainCircuit,
  Users,
  Video,
  Eye,
  Dumbbell,
  AlertCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: <BrainCircuit className="h-5 w-5" />,
    title: "Top coaching insights",
    description:
      "AI surfaces the 5 most important strategic observations from your game — each with a confidence score and evidence references.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Player-by-player feedback",
    description:
      "Every tagged player receives a structured report: strengths, improvement areas, and one focus for the next session.",
  },
  {
    icon: <Video className="h-5 w-5" />,
    title: "Evidence-linked timestamps",
    description:
      "Every insight points to specific tagged events. Coaches can trace every AI claim back to a real moment in the footage.",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Opponent tendencies",
    description:
      "Patterns observed about the opposition, with recommended responses to prepare for the next match.",
  },
  {
    icon: <Dumbbell className="h-5 w-5" />,
    title: "Next-practice plan",
    description:
      "Specific drills with timing and coaching points — built from what your team actually needs, not generic advice.",
  },
  {
    icon: <AlertCircle className="h-5 w-5" />,
    title: "Confidence and assumptions",
    description:
      "Every report includes an assumptions section — what the AI was uncertain about and where coaches should verify manually.",
  },
];

export function ReportFeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            What the report includes
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            Six sections. Every section is evidence-linked, confidence-scored, and editable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sky-400 group-hover:bg-sky-500/10 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
