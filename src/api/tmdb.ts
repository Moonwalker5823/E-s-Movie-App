import type {
  MediaType,
  TitleDetails,
  TmdbItem,
  WatchProviders,
} from "../lib/types";

const BASE = "https://api.themoviedb.org/3";
const TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;
const KEY = import.meta.env.VITE_TMDB_KEY as string | undefined;

export const IMG = {
  poster: (p?: string | null, size: "w342" | "w500" = "w342") =>
    p ? `https://image.tmdb.org/t/p/${size}${p}` : "",
  backdrop: (p?: string | null, size: "w780" | "w1280" | "original" = "w1280") =>
    p ? `https://image.tmdb.org/t/p/${size}${p}` : "",
  logo: (p?: string | null) => (p ? `https://image.tmdb.org/t/p/w92${p}` : ""),
};

export function hasTmdbKey() {
  return Boolean(TOKEN || KEY);
}

async function tmdb<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const headers: Record<string, string> = { accept: "application/json" };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  } else if (KEY) {
    url.searchParams.set("api_key", KEY);
  } else {
    throw new Error("NO_TMDB_KEY");
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json() as Promise<T>;
}

interface Paged<T> {
  results: T[];
  total_pages?: number;
}

export const titleOf = (i: TmdbItem) => i.title || i.name || "Untitled";
export const yearOf = (i: TmdbItem) => {
  const d = i.release_date || i.first_air_date || "";
  return d ? d.slice(0, 4) : "";
};

export async function trending(window: "day" | "week" = "week") {
  const data = await tmdb<Paged<TmdbItem>>(`/trending/all/${window}`);
  return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
}

export async function discover(
  media: MediaType,
  params: Record<string, string | number> = {}
) {
  const data = await tmdb<Paged<TmdbItem>>(`/discover/${media}`, {
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": 40,
    ...params,
  });
  return data.results.map((r) => ({ ...r, media_type: media }));
}

export async function byGenre(media: MediaType, genreId: number, extra: Record<string, string | number> = {}) {
  return discover(media, { with_genres: genreId, ...extra });
}

// Browse a streaming service's US catalog (JustWatch data via TMDB).
// `providers` can be one id (15) or a pipe-joined OR set ("73|300|207") to
// merge several services into a single catalog.
export async function byProvider(media: MediaType, providers: number | string, page = 1) {
  const data = await tmdb<Paged<TmdbItem>>(`/discover/${media}`, {
    watch_region: "US",
    with_watch_providers: providers,
    sort_by: "popularity.desc",
    include_adult: "false",
    "vote_count.gte": 5,
    page,
  });
  return {
    items: data.results.map((r) => ({ ...r, media_type: media })),
    totalPages: data.total_pages || 1,
  };
}

export async function search(query: string) {
  if (!query.trim()) return [];
  const data = await tmdb<Paged<TmdbItem>>("/search/multi", {
    query,
    include_adult: "false",
  });
  return data.results.filter(
    (r) => (r.media_type === "movie" || r.media_type === "tv") && (r.poster_path || r.backdrop_path)
  );
}

export async function details(media: MediaType, id: number): Promise<TitleDetails> {
  return tmdb<TitleDetails>(`/${media}/${id}`, { append_to_response: "videos" });
}

export async function recommendations(media: MediaType, id: number) {
  const data = await tmdb<Paged<TmdbItem>>(`/${media}/${id}/recommendations`);
  return data.results.map((r) => ({ ...r, media_type: media }));
}

export async function watchProviders(media: MediaType, id: number, region = "US"): Promise<WatchProviders> {
  const data = await tmdb<{ results: Record<string, WatchProviders> }>(
    `/${media}/${id}/watch/providers`
  );
  return data.results?.[region] || {};
}

const keywordCache = new Map<string, number | null>();
export async function searchKeyword(query: string): Promise<number | null> {
  if (keywordCache.has(query)) return keywordCache.get(query)!;
  const data = await tmdb<Paged<{ id: number; name: string }>>("/search/keyword", { query });
  const id = data.results?.[0]?.id ?? null;
  keywordCache.set(query, id);
  return id;
}

export async function byKeyword(media: MediaType, keyword: string, extra: Record<string, string | number> = {}) {
  const id = await searchKeyword(keyword);
  if (!id) return [];
  return discover(media, { with_keywords: id, ...extra });
}

export async function peopleKnownFor(names: string[]) {
  const seen = new Set<number>();
  const out: TmdbItem[] = [];
  const lists = await Promise.all(
    names.map((n) =>
      tmdb<Paged<{ known_for?: TmdbItem[] }>>("/search/person", { query: n }).catch(() => ({ results: [] }))
    )
  );
  for (const list of lists) {
    const top = list.results?.[0];
    for (const item of top?.known_for || []) {
      if (
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path &&
        !seen.has(item.id)
      ) {
        seen.add(item.id);
        out.push(item);
      }
    }
  }
  return out;
}
