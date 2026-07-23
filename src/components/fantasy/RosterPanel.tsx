import { myRoster, needs, undoLast, resetDraft, useDraft, DEFAULT_SETTINGS } from "../../lib/fantasy/draft";
import type { Pos } from "../../lib/fantasy/types";

const ORDER: Pos[] = ["QB", "RB", "WR", "TE", "K", "DST"];

/** Your drafted roster + live positional needs. */
export default function RosterPanel() {
  useDraft();
  const roster = myRoster();
  const { starterNeed, flexNeed, count } = needs();

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">My Squad ({roster.length})</h3>
        <div className="flex gap-2">
          <button onClick={undoLast} data-focusable className="btn-ghost !px-3 !py-1 text-xs">↩ Undo</button>
          <button
            onClick={() => confirm("Reset the whole draft?") && resetDraft()}
            data-focusable
            className="btn-ghost !px-3 !py-1 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Needs */}
      <div className="mb-3 flex flex-wrap gap-2">
        {ORDER.map((pos) => {
          const need = starterNeed[pos] || 0;
          return (
            <span
              key={pos}
              className={`sticker ${need > 0 ? "bg-spray text-cream" : "bg-white/10 text-cream/60"}`}
            >
              {pos} {count(pos)}/{DEFAULT_SETTINGS[pos]}
            </span>
          );
        })}
        <span className={`sticker ${flexNeed > 0 ? "bg-cyan text-ink" : "bg-white/10 text-cream/60"}`}>
          FLEX {flexNeed > 0 ? "need" : "ok"}
        </span>
      </div>

      <div className="no-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
        {roster.length === 0 && <p className="text-sm text-cream/50">No picks yet. Draft your first player →</p>}
        {roster.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-white/5 px-3 py-2">
            <span className="w-5 text-xs text-cream/40">{i + 1}</span>
            <span className="font-display text-cream">{p.pos}</span>
            <span className="flex-1 text-sm font-semibold text-cream">{p.name}</span>
            <span className="text-xs text-cream/40">{p.team}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
