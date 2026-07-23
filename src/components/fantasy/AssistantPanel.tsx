import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { askAssistant } from "../../api/assistant";
import { draftPlayer, available, useDraft } from "../../lib/fantasy/draft";
import { useSettings } from "../../lib/settings";
import type { AssistantPick } from "../../lib/fantasy/types";

/** The live AI draft assistant — recommends your next pick and answers questions. */
export default function AssistantPanel() {
  useDraft();
  const { accessCode } = useSettings();
  const locked = !accessCode; // no code on this device → live AI is gated
  const [pick, setPick] = useState<AssistantPick | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const ask = async (question?: string) => {
    setLoading(true);
    setPick(await askAssistant(question));
    setLoading(false);
  };

  const draftRec = () => {
    if (!pick) return;
    const match = available().find((p) => p.name.toLowerCase() === pick.recommendation.toLowerCase());
    if (match) draftPlayer(match.id, "me");
  };

  return (
    <div className="card flex flex-col p-4" style={{ boxShadow: "0 0 40px rgba(255,46,136,.25)" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-spray text-cream shadow-piece">🧠</span>
        <h3 className="font-display text-2xl text-cream">Draft Assistant</h3>
        {locked && (
          <span className="sticker bg-yellow text-ink" title="Live AI is locked">🔒 Locked</span>
        )}
      </div>

      {locked && (
        <Link to="/settings" data-focusable className="mb-2 block rounded-lg border border-yellow/40 bg-yellow/10 p-2 text-xs text-cream/90">
          🔒 Live AI is locked. Add your access code in <b>Settings → AI Access Code</b> to unlock it.
          Picks below use the built-in offline draft brain.
        </Link>
      )}

      <button onClick={() => ask()} data-focusable className="btn-spray w-full" disabled={loading}>
        {loading ? "Thinking…" : locked ? "⚡ Get a pick (offline)" : "⚡ Who should I pick?"}
      </button>

      {pick && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <div className="rounded-xl border border-spray/40 bg-spray/10 p-3">
            <div className="u-label !rotate-0 text-cyan">Recommended</div>
            <div className="font-display text-3xl text-cream">{pick.recommendation}</div>
            <p className="mt-1 text-sm text-cream/80">{pick.reason}</p>
            {pick.alternates.length > 0 && (
              <p className="mt-2 text-xs text-cream/50">Alternates: {pick.alternates.join(" · ")}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button onClick={draftRec} data-focusable className="btn-spray !py-1 text-xs">Draft this pick</button>
              <span className={`sticker ${pick.source === "claude" ? "bg-cyan text-ink" : "bg-white/10 text-cream/60"}`}>
                {pick.source === "claude" ? "AI" : "offline"}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) ask(q.trim());
        }}
        className="mt-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-focusable
          placeholder="Ask… e.g. 'RB or WR here?'"
          className="w-full rounded-lg border-2 border-line bg-white/5 px-4 py-2 text-sm outline-none focus:border-spray/50"
        />
      </form>
    </div>
  );
}
