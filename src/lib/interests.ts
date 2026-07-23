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

// Curated, tasteful list of prominent Latina & Afro-Latina actresses.
const LEADING_LADIES = [
  "Zoe Saldana",
  "Tessa Thompson",
  "Amara La Negra",
  "Dascha Polanco",
  "Zoe Kravitz",
  "Gina Torres",
  "Melissa De Sousa",
  "Judy Reyes",
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
    key: "ladies",
    title: "Leading Ladies — Latina & Afro-Latina Stars",
    emoji: "💃",
    load: () => peopleKnownFor(LEADING_LADIES),
  },
  {
    key: "espanol",
    title: "En Español — Latino Cinema",
    emoji: "🌎",
    load: () => discover("movie", { with_original_language: "es", "vote_count.gte": 50 }),
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
