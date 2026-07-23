import { useMemo } from "react";
import Hero from "../components/Hero";
import Row from "../components/Row";
import { HOME_RAILS, dedupe } from "../lib/interests";
import { recommendations } from "../api/tmdb";
import { seedIds, useFavorites } from "../lib/favorites";

export default function Home() {
  const favs = useFavorites();

  // Build a "Because you liked…" rail from the user's favorites.
  const recRail = useMemo(() => {
    const seeds = seedIds();
    if (seeds.length === 0) return null;
    return {
      key: "recs",
      title: "Because You Liked Your Favorites",
      emoji: "✨",
      load: async () => {
        const lists = await Promise.all(
          seeds.map((s) => recommendations(s.media_type, s.id).catch(() => []))
        );
        return dedupe(lists.flat());
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favs.length]);

  return (
    <div>
      <Hero />
      <div className="mt-6 space-y-8">
        {recRail && <Row key={recRail.key + favs.length} title={recRail.title} emoji={recRail.emoji} load={recRail.load} />}
        {HOME_RAILS.map((r) => (
          <Row key={r.key} title={r.title} emoji={r.emoji} load={r.load} />
        ))}
      </div>
    </div>
  );
}
