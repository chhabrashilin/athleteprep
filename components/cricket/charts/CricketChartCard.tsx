interface Props {
  title: string;
  description?: string;
  badge?: string;
  children: React.ReactNode;
}

export function CricketChartCard({ title, description, badge, children }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          {badge && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 shrink-0">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
