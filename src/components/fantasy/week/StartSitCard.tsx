import { useState } from "react";
import { askStartSit } from "../../../api/assistant";
import type { StartSitResult } from "../../../lib/fantasy/types";

/** Start/sit advice for the week (AI when unlocked, else the bye-aware offline lineup). */
export default function StartSitCard() {
  const [res, setRes] = useState<StartSitResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setRes(await askStartSit());
    setLoading(false);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">Start / Sit</h3>
        <button onClick={run} data-focusable disabled={loading} className="btn-spray !px-3 !py-1 text-xs disabled:opacity-50">
          {loading ? "…" : "Get advice"}
        </button>
      </div>
      {!res && <p className="mt-2 text-sm text-cream/50">Who to start this week, matchup- and bye-aware.</p>}
      {res && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <span className="u-label">Start</span>{" "}
            <span className="text-cream/85">{res.starters.join(", ") || "—"}</span>
          </div>
          {res.sit.length > 0 && (
            <div>
              <span className="u-label !text-cream/40">Bench</span> <span className="text-cream/50">{res.sit.join(", ")}</span>
            </div>
          )}
          <p className="text-xs text-cream/60">{res.reason}</p>
          <span className="text-[10px] uppercase tracking-wide text-cream/40">{res.source === "claude" ? "AI" : "offline"}</span>
        </div>
      )}
    </div>
  );
}
