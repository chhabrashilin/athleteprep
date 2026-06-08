interface Props {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export function CommerceEmptyState({ title, description, icon = "🛒", action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-16 text-center">
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
