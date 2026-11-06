import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { liveGames, type Game } from "../../api/espn";
import GameCard from "../GameCard";

// Games in progress RIGHT NOW, across every league. Lives above the fold on the home
// screen because "is anything on?" is the question the TV gets turned on to answer.
// Renders nothing when nothing is live — an empty "Live Now" shelf is worse than none.

export default function LiveNow() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    let alive = true;
    const pull = () =>
      liveGames()
        .then((g) => alive && setGames(g))
        .catch(() => alive && setGames([])); // scores are best-effort; never break the page
    pull();
    // Same 45s cadence the Sports page uses, so a score here is never staler than there.
    const t = window.setInterval(pull, 45_000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  if (games.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head flex items-baseline justify-between gap-3 px-4 sm:px-10">
        <h2 className="u-display flex items-center gap-2.5 text-2xl text-cream sm:text-3xl">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-spray" aria-hidden />
          Live Now
        </h2>
        <Link to="/sports" data-focusable className="btn-ghost !py-1.5 !text-xs">
          All scores
        </Link>
      </div>
      <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
        {games.slice(0, 6).map((g) => (
          <GameCard key={`${g.league ?? ""}-${g.id}`} g={g} />
        ))}
      </div>
    </section>
  );
}
