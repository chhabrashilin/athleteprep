import { Shield, CheckSquare, BookOpen, GitBranch, Lock, BarChart2 } from "lucide-react";

const TRUST_POINTS = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Evidence references",
    description:
      "Every insight points to the specific tagged events that support it. Coaches can see exactly what the AI used to reach each conclusion.",
  },
  {
    icon: <BarChart2 className="h-5 w-5" />,
    title: "Confidence scores",
    description:
      "High, Medium, or Low — every insight is rated by how much evidence supports it. Medium-confidence claims get extra scrutiny.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Assumptions and limitations",
    description:
      "Every report ends with an honest assumptions section. The AI explains what it could not verify and where manual review is recommended.",
  },
  {
    icon: <CheckSquare className="h-5 w-5" />,
    title: "Coach verification",
    description:
      "Coaches mark each insight as Accurate, Partially Accurate, or Inaccurate — and add correction notes. The report becomes coach-authored.",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Editable reports",
    description:
      "Coaches can edit any AI output before sharing. The original AI content is always preserved separately for reference.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Original AI output preserved",
    description:
      "Nothing gets silently overwritten. Edits and verifications are layered on top of the original — maintaining a full audit trail.",
  },
];

export function TrustSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">
            Why coaches trust it
          </h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">
            GameIQ is a reasoning tool, not a black box. Every claim is traceable, every output is
            editable, and every AI decision is transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_POINTS.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                {t.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{t.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
