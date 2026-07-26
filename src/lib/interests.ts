import { byGenre, byKeyword, discover, peopleKnownFor, trending } from "../api/tmdb";
import type { TmdbItem } from "./types";

export interface Rail {
  key: string;
  title: string;
  emoji: string;
  load: () => Promise<TmdbItem[]>;
}

// TMDB genre ids
const G = {
  music: 10402,
  action: 28,
  documentary: 99,
  comedy: 35,
  drama: 18,
  crime: 80,
};

// Icons & classics of Black cinema — actors and directors whose "known for" titles
// build a rich culture rail on the Home page.
const BLACK_CINEMA_STARS = [
  "Denzel Washington",
  "Will Smith",
  "Michael B. Jordan",
  "Viola Davis",
  "Samuel L. Jackson",
  "Spike Lee",
  "Angela Bassett",
  "Wesley Snipes",
  "Regina King",
  "Idris Elba",
  "Taraji P. Henson",
  "Chadwick Boseman",
];

export const HOME_RAILS: Rail[] = [
  {
    key: "trending",
    title: "Trending Now",
    emoji: "🔥",
    load: () => trending("week"),
  },
  {
    key: "music",
    title: "Turn It Up — Music & Concert Films",
    emoji: "🎵",
    load: () => byGenre("movie", G.music, { "vote_count.gte": 20 }),
  },
  {
    key: "cars",
    title: "Fast & Loud — Cars & Racing",
    emoji: "🏎️",
    load: async () => {
      const [a, b] = await Promise.all([
        byKeyword("movie", "car race"),
        byKeyword("movie", "street racing"),
      ]);
      return dedupe([...a, ...b]);
    },
  },
  {
    key: "green",
    title: "Higher Vibes — Stoner Picks",
    emoji: "🌿",
    load: async () => {
      const [a, b] = await Promise.all([
        byKeyword("movie", "marijuana"),
        byKeyword("movie", "stoner"),
      ]);
      return dedupe([...a, ...b]);
    },
  },
  {
    key: "blackcinema",
    title: "Black Cinema — Icons & Classics",
    emoji: "🎭",
    load: () => peopleKnownFor(BLACK_CINEMA_STARS),
  },
  {
    key: "throwbacks",
    title: "90s & 2000s Throwbacks",
    emoji: "📼",
    load: () =>
      discover("movie", {
        "primary_release_date.gte": "1990-01-01",
        "primary_release_date.lte": "2009-12-31",
        "vote_count.gte": 500,
      }),
  },
  {
    key: "docs",
    title: "Real Stories — Documentaries",
    emoji: "🎬",
    load: () => byGenre("movie", G.documentary, { "vote_count.gte": 30 }),
  },
  {
    key: "tvhits",
    title: "Binge-Worthy TV",
    emoji: "📺",
    load: () => discover("tv", { "vote_count.gte": 200 }),
  },
];

export function dedupe(items: TmdbItem[]): TmdbItem[] {
  const seen = new Set<number>();
  return items.filter((i) => {
    if (!i.poster_path || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}
