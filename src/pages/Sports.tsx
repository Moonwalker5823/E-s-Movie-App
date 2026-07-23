import { useEffect, useState } from "react";
import { LEAGUES, scoreboard, type Game } from "../api/espn";
import GameCard from "../components/GameCard";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import Skeleton from "../components/ui/Skeleton";

export default function Sports() {
  const [league, setLeague] = useState(LEAGUES[0]);
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setGames(null);
    setError(false);
    let alive = true;
    scoreboard(league.path)
      .then((g) => alive && setGames(g))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [league]);

  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Sports" emoji="🏆" size="xl">
        Game Day
      </Heading>
      <p className="mt-2 text-cream/60">Today&apos;s games, live scores, and where to catch them.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {LEAGUES.map((l) => (
          <Chip key={l.key} active={league.key === l.key} onClick={() => setLeague(l)}>
            {l.label}
          </Chip>
        ))}
      </div>

      {error ? (
        <p className="mt-8 text-cream/60">Couldn&apos;t load games right now. Try another league.</p>
      ) : games === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <p className="mt-8 text-cream/60">No {league.label} games scheduled today.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={g.id} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}
