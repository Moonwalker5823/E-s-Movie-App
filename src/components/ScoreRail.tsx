import { useEffect, useRef, useState } from "react";
import { railScores, type ScoreCard } from "../api/espn";
import Skeleton from "./ui/Skeleton";

const ROTATE_MS = 6000; // dwell on each game before advancing
const REFRESH_MS = 60_000; // re-pull all scores

const MEDAL = ["🥇", "🥈", "🥉"];

// One game/event, shown in full: teams+scores, a fight card, or a race podium.
function Spotlight({ card }: { card: ScoreCard }) {
  const live = card.state === "in";
  return (
    <div
      className="rounded-xl border border-line bg-black/25 p-3"
      style={{ boxShadow: live ? "inset 0 0 0 1px rgba(53,208,127,.5)" : undefined }}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px]">
        <span className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-cream/80">{card.league}</span>
        <span className={live ? "font-bold text-live" : "text-cream/50"}>
          {live && "● "}
          {card.status}
        </span>
      </div>

      {card.kind === "racing" ? (
        <div>
          <div className="mb-2 line-clamp-2 text-sm font-semibold text-cream">🏁 {card.title}</div>
          {card.standings.length > 0 ? (
            <div className="space-y-1">
              {card.standings.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-4 shrink-0 text-center">{MEDAL[idx] ?? idx + 1}</span>
                  <span className="truncate text-cream/85">{s.who}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-cream/50">{card.note || "Upcoming race"}</div>
          )}
        </div>
      ) : (
        <div>
          {card.kind === "combat" && (
            <div className="mb-1.5 line-clamp-1 text-xs font-semibold text-cream/80">{card.title}</div>
          )}
          <div className="space-y-1.5">
            {card.sides.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {s.logo ? (
                    <img src={s.logo} alt="" className="h-4 w-4 shrink-0" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                  ) : (
                    <span className="grid h-4 w-4 shrink-0 place-items-center text-[10px]">{card.kind === "combat" ? "🥊" : ""}</span>
                  )}
                  <span className={`truncate text-xs font-semibold ${s.winner ? "text-cream" : "text-cream/70"}`}>
                    {s.abbr || s.name}
                  </span>
                  {s.record && <span className="shrink-0 text-[10px] text-cream/35">{s.record}</span>}
                </span>
                {s.score != null && s.score !== "" && (
                  <span className="u-display shrink-0 text-sm text-cream">{s.score}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {card.stats.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-line pt-2">
          {card.stats.map((st, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="shrink-0 text-cream/60">{st.label}</span>
              <span className="truncate text-cream/70">{st.value}</span>
            </div>
          ))}
        </div>
      )}

      {card.note && card.kind !== "racing" && (
        <div className="mt-1.5 truncate text-[10px] text-cream/35">{card.note}</div>
      )}
    </div>
  );
}

/**
 * The Sports rail. Auto-rotates through EVERY game/event across all categories
 * (NFL, NBA, MLB, NHL, CFB, Soccer, UFC, Boxing, F1, IndyCar) — scores/stats,
 * skipping any league with nothing on. ⏮/⏸/⏭ step or hold; it pauses while focused
 * or hovered so you can read.
 */
export default function ScoreRail() {
  const [cards, setCards] = useState<ScoreCard[] | null>(null);
  const [error, setError] = useState(false);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const holdRef = useRef(false); // hover/focus hold (separate from the ⏸ toggle)

  // Fetch all categories up front, then refresh on an interval.
  useEffect(() => {
    let alive = true;
    const load = () =>
      railScores()
        .then((c) => alive && (setCards(c), setError(false)))
        .catch(() => alive && setError(true));
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const n = cards?.length || 0;

  // Auto-advance through the games.
  useEffect(() => {
    if (paused || n <= 1) return;
    const id = window.setInterval(() => {
      if (!holdRef.current) setI((x) => (x + 1) % n);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, n]);

  const idx = n ? i % n : 0;
  const card = n ? cards![idx] : null;
  const step = (d: number) => n && setI((x) => (((x + d) % n) + n) % n);
  const hold = (on: boolean) => (holdRef.current = on);

  const ctrl =
    "grid h-7 w-7 place-items-center rounded-full bg-white/10 text-cream/80 text-xs transition hover:bg-white/20";

  return (
    <div
      onMouseEnter={() => hold(true)}
      onMouseLeave={() => hold(false)}
      onFocusCapture={() => hold(true)}
      onBlurCapture={() => hold(false)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="u-display text-sm text-cream">📊 Live Scores</h3>
        {n > 0 && <span className="text-[10px] text-cream/60">{idx + 1}/{n}</span>}
      </div>

      {n > 1 && (
        <div className="mb-3 flex items-center gap-1.5">
          <button onClick={() => step(-1)} data-focusable aria-label="Previous game" className={ctrl}>⏮</button>
          <button
            onClick={() => setPaused((p) => !p)}
            data-focusable
            aria-label={paused ? "Resume auto-scroll" : "Pause auto-scroll"}
            className={ctrl}
          >
            {paused ? "▶" : "⏸"}
          </button>
          <button onClick={() => step(1)} data-focusable aria-label="Next game" className={ctrl}>⏭</button>
          <span className="ml-1 truncate text-[10px] text-cream/60">{paused ? "paused" : "auto"} · all sports</span>
        </div>
      )}

      {error ? (
        <p className="text-xs text-cream/50">Scores unavailable right now.</p>
      ) : cards === null ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : n === 0 ? (
        <p className="text-xs text-cream/50">No games on right now — check back on game day.</p>
      ) : (
        card && <Spotlight card={card} />
      )}
    </div>
  );
}
