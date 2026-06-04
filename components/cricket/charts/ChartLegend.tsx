interface LegendItem {
  color: string;
  label: string;
  dashed?: boolean;
}

interface Props {
  items: LegendItem[];
}

export function ChartLegend({ items }: Props) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3" role="list" aria-label="Chart legend">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-400" role="listitem">
          <span
            className="inline-block w-5 h-0.5"
            style={{
              backgroundColor: item.color,
              borderTop: item.dashed ? `2px dashed ${item.color}` : undefined,
              background: item.dashed ? "none" : item.color,
            }}
            aria-hidden="true"
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}
