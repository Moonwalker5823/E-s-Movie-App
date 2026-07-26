import { useEffect, useState } from "react";
import { LEAGUES, liveGames, scoreboard, type Game, type League } from "../api/espn";
import GameCard from "../components/GameCard";
import ScoreRail from "../components/ScoreRail";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import Skeleton from "../components/ui/Skeleton";
import VideoHub, { type HubTab } from "../components/VideoHub";

// Your own SportsCenter — highlight clips + shows/pods, none of the talk.
const HIGHLIGHT_TABS: HubTab[] = [
  { key: "all", label: "🔥 Top Plays" },
  { key: "wrap", label: "🌅 Daily Wrap" },
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "soccer", label: "Soccer" },
  { key: "cfb", label: "CFB" },
  { key: "shows", label: "🎙️ Shows & Pods" },
  { key: "and1", label: "🏀 AND1 Streetball" },
];

// A synthetic "league" that mixes every sport's in-progress games into one tab.
const LIVE: League = { key: "live", label: "🔴 Live", path: "__live__" };
const PICKERS: League[] = [LIVE, ...LEAGUES];

export default function Sports() {
  // Land on the Live tab first so "what's on right now" is front and center.
  const [league, setLeague] = useState<League>(LIVE);
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState(false);
  const isLive = league.key === LIVE.key;

  useEffect(() => {
    setGames(null);
    setError(false);
    let alive = true;
    const live = league.key === LIVE.key;
    const fetchGames = () => (live ? liveGames() : scoreboard(league.path));
    fetchGames()
      .then((g) => alive && setGames(g))
      .catch(() => alive && setError(true));
    // The Live tab keeps itself current: re-pull in place every 45s (no skeleton
    // flash) so finished games drop off and scores stay live without leaving the page.
    let timer: number | undefined;
    if (live) {
      timer = window.setInterval(() => {
        liveGames()
          .then((g) => alive && setGames(g))
          .catch(() => {});
      }, 45_000);
    }
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
  }, [league]);

  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Sports" emoji="🏆" size="lg" className="mb-3">
        Game Day
      </Heading>

      {/* Featured highlights auto-play at the very top; clips only, no talk. An
          enlarged viewer with a live-scores rail beside it; "up next" sits below.
          The rail auto-cycles every game across all sports on its own. */}
      <VideoHub tabs={HIGHLIGHT_TABS} autoplay freshHours={3} rail={<ScoreRail />} />

      {/* Scores & schedule */}
      <section className="mt-10">
        <Heading emoji="📊" className="mb-3">Scores & Schedule</Heading>

        <div className="mt-3 flex flex-wrap gap-2">
          {PICKERS.map((l) => (
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
        <p className="mt-8 text-cream/60">
          {isLive ? "Nothing live right now. Check the leagues for today's slate." : `No ${league.label} games scheduled today.`}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameCard key={`${g.league ?? ""}-${g.id}`} g={g} />
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
