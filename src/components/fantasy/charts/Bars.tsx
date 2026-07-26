export interface BarDatum {
  label: string;
  value: number;
  max?: number; // per-bar max (else the group max)
  color?: string;
  note?: string; // right-side label (else the value)
}

/** Horizontal CSS bars, themed to the graffiti palette. Purely presentational — no
 *  focus so it never traps the D-pad ring. */
export default function Bars({ data }: { data: BarDatum[] }) {
  const groupMax = Math.max(1, ...data.map((d) => d.max ?? d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = Math.max(0, Math.min(100, (d.value / (d.max ?? groupMax)) * 100));
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-xs font-semibold text-cream/70">{d.label}</span>
            <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: d.color || "#e6392b" }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs text-cream/60">{d.note ?? d.value}</span>
          </div>
        );
      })}
    </div>
  );
}
