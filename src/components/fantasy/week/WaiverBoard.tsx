import { useState } from "react";
import { askWaivers } from "../../../api/assistant";
import { useTeam, getTeam, addPlayer } from "../../../lib/fantasy/team";
import { useBoard, getBoard } from "../../../lib/fantasy/board";
import type { WaiverResult } from "../../../lib/fantasy/types";

const prioClass: Record<string, string> = {
  high: "bg-spray text-cream",
  med: "bg-yellow text-ink",
  low: "bg-white/10 text-cream/60",
};

/** Trending waiver adds that fit your roster (AI-ranked when unlocked, else trending ∩ needs). */
export default function WaiverBoard() {
  useTeam();
  useBoard();
  const [res, setRes] = useState<WaiverResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setRes(await askWaivers());
    setLoading(false);
  };

  const owned = new Set(getTeam().rosterIds);
  const boardByName = new Map(getBoard().map((p) => [p.name.toLowerCase(), p]));
  const add = (name: string) => {
    const p = boardByName.get(name.toLowerCase());
    if (p) addPlayer(p.id);
  };

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">Waivers &amp; Adds</h3>
        <button onClick={run} data-focusable disabled={loading} className="btn-spray !px-3 !py-1 text-xs disabled:opacity-50">
          {loading ? "…" : "Find pickups"}
        </button>
      </div>
      {!res && <p className="text-sm text-cream/50">Trending pickups that fit your roster's needs.</p>}
      {res && (
        <div className="mt-2 space-y-2">
          {res.adds.length === 0 && <p className="text-sm text-cream/50">{res.reason || "No standout adds right now."}</p>}
          {res.adds.map((a, i) => {
            const p = boardByName.get(a.name.toLowerCase());
            const already = p && owned.has(p.id);
            return (
              <div key={`${a.name}-${i}`} className="flex items-start gap-3 rounded-lg border border-line bg-white/5 p-2.5">
                <span className={`sticker ${prioClass[a.priority] || prioClass.low}`}>{a.priority}</span>
                <span className="flex-1">
                  <span className="font-semibold text-cream">{a.name}</span>
                  {a.pos && <span className="ml-1 text-xs text-cream/40">{a.pos}</span>}
                  <span className="block text-xs text-cream/50">{a.reason}</span>
                </span>
                {already ? (
                  <span className="shrink-0 text-xs text-live">On roster</span>
                ) : p ? (
                  <button onClick={() => add(a.name)} data-focusable className="btn-ghost shrink-0 !px-2 !py-1 text-xs">
                    + Add
                  </button>
                ) : null}
              </div>
            );
          })}
          {res.drops.length > 0 && <p className="text-xs text-cream/40">Droppable: {res.drops.join(", ")}</p>}
          <span className="text-[10px] uppercase tracking-wide text-cream/40">{res.source === "claude" ? "AI" : "offline"}</span>
        </div>
      )}
    </div>
  );
}
