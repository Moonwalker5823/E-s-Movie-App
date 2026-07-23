import { motion } from "framer-motion";
import type { Game, Team } from "../api/espn";

function watchLink(networks: string[], home: string, away: string) {
  const q = networks[0] ? `watch ${away} vs ${home} on ${networks[0]}` : `where to watch ${away} vs ${home}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function TeamRow({ t, showScore }: { t: Team; showScore: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {t.logo ? <img src={t.logo} alt="" className="h-7 w-7" /> : <span className="h-7 w-7" />}
      <span className={`flex-1 font-semibold ${t.winner ? "text-cream" : "text-cream/70"}`}>{t.displayName}</span>
      {showScore && <span className="u-display text-xl text-cream">{t.score ?? "-"}</span>}
    </div>
  );
}

/** One game: teams, score/status, broadcast network, where-to-watch. */
export default function GameCard({ g }: { g: Game }) {
  const live = g.state === "in";
  const showScore = live || g.state === "post";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
      style={{ boxShadow: live ? "inset 0 0 0 1px rgba(53,208,127,.5)" : undefined }}
    >
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className={live ? "font-bold text-live" : "text-cream/50"}>
          {live && "● "}
          {g.statusDetail}
        </span>
        {g.broadcasts.length > 0 && (
          <span className="rounded bg-white/10 px-2 py-0.5 font-semibold text-cream/80">
            {g.broadcasts.join(", ")}
          </span>
        )}
      </div>

      <TeamRow t={g.away} showScore={showScore} />
      <TeamRow t={g.home} showScore={showScore} />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-cream/40">{g.venue || ""}</span>
        <a
          href={watchLink(g.broadcasts, g.home.displayName, g.away.displayName)}
          target="_blank"
          rel="noreferrer"
          data-focusable
          className="rounded-full bg-spray px-3 py-1 text-xs font-bold text-ink"
        >
          {g.state === "pre" ? "Where to watch ↗" : "Watch / recap ↗"}
        </a>
      </div>
    </motion.div>
  );
}
