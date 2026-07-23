import { useMemo, useState } from "react";
import { available, draftPlayer, addCustomPlayer, useDraft } from "../../lib/fantasy/draft";
import ScoutCard from "./ScoutCard";
import type { Player, Pos } from "../../lib/fantasy/types";

const POSITIONS: (Pos | "ALL")[] = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"];
const posColor: Record<string, string> = {
  QB: "text-cyan", RB: "text-lime", WR: "text-sprayhi", TE: "text-yellow", K: "text-purple", DST: "text-live",
};

export default function PlayerPool() {
  const draft = useDraft(); // re-render on picks
  const [pos, setPos] = useState<Pos | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    return available().filter(
      (p) => (pos === "ALL" || p.pos === pos) && p.name.toLowerCase().includes(q.toLowerCase())
    );
  }, [pos, q, draft.order.length, draft.custom.length]);

  const addAndDraft = (by: "me" | "other") => {
    const name = q.trim();
    if (!name) return;
    const p = addCustomPlayer({ name, pos: pos === "ALL" ? "WR" : pos, team: "FA", bye: 0, adp: 999, tier: 9 });
    draftPlayer(p.id, by);
    setQ("");
  };

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {POSITIONS.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            data-focusable
            className={`chip ${pos === p ? "chip-active" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        data-focusable
        placeholder="Search or add a player…"
        className="mb-3 w-full rounded-lg border-2 border-line bg-white/5 px-4 py-2 outline-none focus:border-spray/50"
      />

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "62vh" }}>
        {list.map((p) => (
          <PlayerRow key={p.id} p={p} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} />
        ))}
        {list.length === 0 && q.trim() && (
          <div className="rounded-lg border border-line p-3 text-sm">
            <div className="mb-2 text-cream/70">Not on the board. Add &ldquo;{q.trim()}&rdquo;:</div>
            <div className="flex gap-2">
              <button onClick={() => addAndDraft("me")} data-focusable className="btn-spray">+ Draft to my team</button>
              <button onClick={() => addAndDraft("other")} data-focusable className="btn-ghost">Mark taken</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ p, open, onToggle }: { p: Player; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-line bg-white/5">
      <div className="flex items-center gap-3 p-3">
        <span className={`font-display text-lg ${posColor[p.pos] || "text-cream"}`}>{p.pos}</span>
        <button onClick={onToggle} data-focusable className="flex-1 text-left">
          <div className="font-semibold text-cream">{p.name}</div>
          <div className="text-xs text-cream/40">{p.team} · Bye {p.bye} · ADP {p.adp}</div>
        </button>
        <button onClick={() => draftPlayer(p.id, "me")} data-focusable className="btn-spray !px-3 !py-1 text-xs">
          Draft
        </button>
        <button onClick={() => draftPlayer(p.id, "other")} data-focusable className="btn-ghost !px-3 !py-1 text-xs">
          Taken
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3">
          <ScoutCard player={p} />
        </div>
      )}
    </div>
  );
}
