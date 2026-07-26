import type { ReactNode } from "react";

/** A compact stat tile (mirrors the ScoutCard stat style), reused across analytics. */
export default function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/5 p-3">
      <div className="u-label !rotate-0 text-[10px]">{label}</div>
      <div className="font-display text-2xl text-cream">{value}</div>
      {sub && <div className="text-xs text-cream/40">{sub}</div>}
    </div>
  );
}
