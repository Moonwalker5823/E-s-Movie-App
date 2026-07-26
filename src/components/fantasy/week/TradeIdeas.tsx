import { useState } from "react";
import { askTrade } from "../../../api/assistant";
import type { TradeResult } from "../../../lib/fantasy/types";

/** Trade angles that upgrade your weak spots using your depth (AI when unlocked). */
export default function TradeIdeas() {
  const [res, setRes] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setRes(await askTrade());
    setLoading(false);
  };

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">Trade Ideas</h3>
        <button onClick={run} data-focusable disabled={loading} className="btn-spray !px-3 !py-1 text-xs disabled:opacity-50">
          {loading ? "…" : "Get ideas"}
        </button>
      </div>
      {!res && <p className="text-sm text-cream/50">Trade from your depth to fix your weak spots.</p>}
      {res &&
        (res.ideas.length === 0 ? (
          <p className="mt-2 text-sm text-cream/50">No clear trade edge right now — revisit after this week's games.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {res.ideas.map((idea, i) => (
              <div key={i} className="rounded-lg border border-line bg-white/5 p-2.5 text-sm">
                <div className="font-semibold text-cream">
                  Give <span className="text-sprayhi">{idea.give.join(", ")}</span> → Get{" "}
                  <span className="text-live">{idea.get.join(", ")}</span>
                </div>
                <p className="mt-0.5 text-xs text-cream/50">{idea.reason}</p>
              </div>
            ))}
            <span className="text-[10px] uppercase tracking-wide text-cream/40">{res.source === "claude" ? "AI" : "offline"}</span>
          </div>
        ))}
    </div>
  );
}
