// Canonical list of services the user can flag as "mine" + where to sign in.
// Sign-in always happens on the service's OWN site — this app never handles
// third-party passwords. These are just deep links + a display/match config.

export interface Service {
  key: string;
  name: string;
  match: RegExp; // matches TMDB provider display names
  loginUrl: string;
  free?: boolean;
  color: string;
  tmdbId?: number; // TMDB/JustWatch US watch-provider id (for catalog browse)
  liveUrl?: string; // where this service opens LIVE sports (set only for ones that carry it)
}

export const STREAMING_SERVICES: Service[] = [
  { key: "hulu", name: "Hulu", match: /hulu/i, loginUrl: "https://auth.hulu.com/web/login", color: "#1ce783", tmdbId: 15, liveUrl: "https://www.hulu.com/live-tv" },
  { key: "prime", name: "Prime Video", match: /prime video/i, loginUrl: "https://www.primevideo.com/", color: "#00a8e1", tmdbId: 9, liveUrl: "https://www.amazon.com/gp/video/sports" },
  { key: "tubi", name: "Tubi", match: /tubi/i, loginUrl: "https://tubitv.com/login", free: true, color: "#fa382b", tmdbId: 73, liveUrl: "https://tubitv.com/live" },
  { key: "netflix", name: "Netflix", match: /netflix/i, loginUrl: "https://www.netflix.com/login", color: "#e50914", tmdbId: 8 },
  { key: "max", name: "Max", match: /\bmax\b|hbo/i, loginUrl: "https://play.max.com/", color: "#7b2ff7", tmdbId: 1899, liveUrl: "https://play.max.com/" },
  { key: "disney", name: "Disney+", match: /disney/i, loginUrl: "https://www.disneyplus.com/login", color: "#113ccf", tmdbId: 337 },
  { key: "paramount", name: "Paramount+", match: /paramount/i, loginUrl: "https://www.paramountplus.com/account/signin/", color: "#0064ff", tmdbId: 531, liveUrl: "https://www.paramountplus.com/live-tv/" },
  { key: "peacock", name: "Peacock", match: /peacock/i, loginUrl: "https://www.peacocktv.com/signin", color: "#000000", tmdbId: 386, liveUrl: "https://www.peacocktv.com/watch/sports" },
  { key: "apple", name: "Apple TV+", match: /apple/i, loginUrl: "https://tv.apple.com/", color: "#dddddd", tmdbId: 350 },
  { key: "pluto", name: "Pluto TV", match: /pluto/i, loginUrl: "https://pluto.tv/", free: true, color: "#0b1636", tmdbId: 300 },
  { key: "youtube", name: "YouTube", match: /youtube/i, loginUrl: "https://accounts.google.com/", color: "#ff0000" },
];

export const FANTASY_SITES = [
  { key: "yahoo", name: "Yahoo Fantasy", loginUrl: "https://football.fantasysports.yahoo.com/", color: "#6001d2" },
  { key: "espn", name: "ESPN Fantasy", loginUrl: "https://fantasy.espn.com/football/", color: "#c8102e" },
  { key: "sleeper", name: "Sleeper", loginUrl: "https://sleeper.com/", color: "#ff4d6d" },
];

export function serviceKeyForProvider(providerName: string): string | null {
  return STREAMING_SERVICES.find((s) => s.match.test(providerName))?.key ?? null;
}

export function serviceByKey(key: string): Service | undefined {
  return STREAMING_SERVICES.find((s) => s.key === key);
}

// The user's own services that carry LIVE sports — used to launch a live game straight
// into a service they already have (Hulu + Live TV, Prime, Tubi, Max, Paramount+, Peacock).
export function liveServices(myServices: string[]): Service[] {
  return STREAMING_SERVICES.filter((s) => s.liveUrl && myServices.includes(s.key));
}

// Pipe-joined TMDB provider ids for the services the user flagged as "mine".
// Used to browse one combined catalog of everything they have access to.
export function myProviderIds(myServices: string[]): string {
  return STREAMING_SERVICES.filter((s) => myServices.includes(s.key) && s.tmdbId)
    .map((s) => s.tmdbId)
    .join("|");
}
