// Maps TMDB provider names -> where to launch/search. TMDB doesn't give per-title
// deep links, so we open the service's own site (its own search when possible),
// which then hands off to the installed app on TV.
interface ProviderLink {
  match: RegExp;
  home: string;
  search?: (q: string) => string;
  color: string;
}

const PROVIDERS: ProviderLink[] = [
  {
    match: /hulu/i,
    home: "https://www.hulu.com/hub/home",
    search: (q) => `https://www.hulu.com/search?q=${encodeURIComponent(q)}`,
    color: "#1ce783",
  },
  {
    match: /amazon|prime video/i,
    home: "https://www.primevideo.com/",
    search: (q) => `https://www.primevideo.com/search/?phrase=${encodeURIComponent(q)}`,
    color: "#00a8e1",
  },
  {
    match: /netflix/i,
    home: "https://www.netflix.com/",
    search: (q) => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
    color: "#e50914",
  },
  {
    match: /tubi/i,
    home: "https://tubitv.com/home",
    search: (q) => `https://tubitv.com/search/${encodeURIComponent(q)}`,
    color: "#fa382b",
  },
  {
    match: /disney/i,
    home: "https://www.disneyplus.com/",
    search: (q) => `https://www.disneyplus.com/search?q=${encodeURIComponent(q)}`,
    color: "#113ccf",
  },
  {
    match: /max|hbo/i,
    home: "https://www.max.com/",
    search: (q) => `https://www.max.com/search?q=${encodeURIComponent(q)}`,
    color: "#7b2ff7",
  },
  {
    match: /peacock/i,
    home: "https://www.peacocktv.com/",
    color: "#000000",
  },
  {
    match: /paramount/i,
    home: "https://www.paramountplus.com/",
    search: (q) => `https://www.paramountplus.com/search/?query=${encodeURIComponent(q)}`,
    color: "#0064ff",
  },
  {
    match: /apple/i,
    home: "https://tv.apple.com/",
    color: "#ffffff",
  },
  {
    match: /pluto/i,
    home: "https://pluto.tv/en/live-tv",
    color: "#000d24",
  },
  {
    match: /roku/i,
    home: "https://therokuchannel.roku.com/",
    color: "#662d91",
  },
  {
    match: /youtube/i,
    home: "https://www.youtube.com/",
    search: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    color: "#ff0000",
  },
];

export function launchUrlFor(providerName: string, title: string): string {
  const p = PROVIDERS.find((x) => x.match.test(providerName));
  if (!p) return `https://www.google.com/search?q=${encodeURIComponent(`watch ${title} ${providerName}`)}`;
  return p.search ? p.search(title) : p.home;
}

export function colorFor(providerName: string): string {
  return PROVIDERS.find((x) => x.match.test(providerName))?.color || "#8b5cf6";
}
