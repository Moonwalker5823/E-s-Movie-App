import { useState } from "react";
import { askAssistant } from "../../api/assistant";
import type { Player } from "../../lib/fantasy/types";

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const news = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=nws`;

/** Scouting panel for one player: seed stats, film, news, AI report. */
export default function ScoutCard({ player }: { player: Player }) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getReport = async () => {
    setLoading(true);
    const r = await askAssistant(
      `Give a 2-3 sentence fantasy scouting report and current outlook for ${player.name} (${player.pos}, ${player.team}).`
    );
    setReport(r.reason || "No report available.");
    setLoading(false);
  };

  const stat = (label: string, value: string | number) => (
    <div className="rounded-lg border border-line bg-white/5 px-3 py-2">
      <div className="u-label !text-cyan !rotate-0 text-[10px]">{label}</div>
      <div className="font-display text-2xl text-cream">{value}</div>
    </div>
  );

  return (
    <div className="mt-3 rounded-xl border border-line bg-ink/60 p-4">
      <div className="grid grid-cols-4 gap-2">
        {stat("Pos", player.pos)}
        {stat("Team", player.team)}
        {stat("ADP", player.adp)}
        {stat("Bye", player.bye)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a href={yt(`${player.name} highlights`)} target="_blank" rel="noreferrer" data-focusable className="btn-ghost">
          ▶ Film
        </a>
        <a href={news(`${player.name} fantasy news injury`)} target="_blank" rel="noreferrer" data-focusable className="btn-ghost">
          📰 News
        </a>
        <button onClick={getReport} data-focusable className="btn-spray" disabled={loading}>
          {loading ? "Scouting…" : "🧠 AI Scouting Report"}
        </button>
      </div>

      {report && (
        <p className="mt-3 rounded-lg border border-spray/30 bg-spray/5 p-3 text-sm text-cream/90">{report}</p>
      )}
      <p className="mt-2 text-[11px] text-cream/40">
        Stats are seed values — the AI report uses live knowledge.
      </p>
    </div>
  );
}
