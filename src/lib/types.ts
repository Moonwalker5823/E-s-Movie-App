export type MediaType = "movie" | "tv";

export interface TmdbItem {
  id: number;
  media_type?: MediaType;
  title?: string; // movie
  name?: string; // tv
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  popularity?: number;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  name: string;
  official?: boolean;
}

export interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  link?: string;
  flatrate?: Provider[]; // subscription
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
}

export interface TitleDetails extends TmdbItem {
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  number_of_seasons?: number;
  videos?: { results: Video[] };
}

export interface FavoriteItem {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path?: string | null;
  addedAt: number;
  list: "favorites" | "watchlist";
}
