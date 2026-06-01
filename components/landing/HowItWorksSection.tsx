import { Upload, Tag, FileText } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: <Upload className="h-6 w-6" />,
    title: "Upload game film and add context",
    description:
      "Upload your match or practice video. Add metadata — sport, date, opponent, score, venue, competition level, and coach notes. The more context you provide, the better the analysis.",
  },
  {
    step: "02",
    icon: <Tag className="h-6 w-6" />,
    title: "Tag key moments and connect players",
    description:
      "Tag key events with timestamps — individual plays, patterns, opponent tendencies. Link each moment to the players involved. These tags become the evidence the AI reasons over.",
  },
  {
    step: "03",
    icon: <FileText className="h-6 w-6" />,
    title: "Generate a coach-ready AI report",
    description:
      "AI analyzes your inputs and produces coaching insights, player feedback, opponent tendencies, and a next-practice plan. Every claim is evidence-linked and confidence-scored.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            From upload to insights in three steps
          </h2>
          <p className="mt-3 text-slate-400">
            No complex setup. No manual report building. Just structured analysis your team can act
            on.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative rounded-xl border border-slate-800 bg-slate-900 p-6">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 z-10 w-6 h-px bg-slate-700" />
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  {step.icon}
                </div>
                <span className="text-3xl font-bold text-slate-800">{step.step}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
