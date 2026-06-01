import {
  BrainCircuit,
  Clock,
  Shield,
  Users,
  Target,
  CheckSquare,
} from "lucide-react";

const FEATURES = [
  {
    icon: <BrainCircuit className="h-5 w-5" />,
    title: "Top 5 Coaching Insights",
    description:
      "AI surfaces the most important strategic observations from your game, grounded in your timestamps and notes.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Player-by-Player Reports",
    description:
      "Each player receives an individual breakdown with specific strengths, areas for improvement, and evidence-linked moments.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Confidence Scores",
    description:
      "Every insight is rated High, Medium, or Low confidence with supporting evidence — so coaches know what to trust.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Evidence-Linked Timestamps",
    description:
      "Jump to exact video moments that support each insight. AI claims are always traceable to real events you tagged.",
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Next-Practice Plans",
    description:
      "AI generates specific drills and focus areas based on what your team actually needs — not generic advice.",
  },
  {
    icon: <CheckSquare className="h-5 w-5" />,
    title: "Coach Verification",
    description:
      "Review, verify, edit, and approve every AI-generated insight before sharing. You stay in control of the final report.",
  },
];

export function FeatureGrid() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            Everything a coaching staff needs
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            GameIQ replaces hours of manual film review with structured, evidence-backed analysis
            your team can act on immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-sky-400 group-hover:bg-sky-500/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
