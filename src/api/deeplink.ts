// Client for the /api/deeplink resolver — exact per-title streaming deep links
// (Hulu /watch, Prime /detail, Disney /browse, …) so "Play on X" lands on the
// exact title instead of a search page the TV apps mis-handle. Best-effort: an
// empty map just means callers use their search-URL fallback.
import type { MediaType } from "../lib/types";

export type DeepLinks = Record<string, string>; // normalized provider name -> URL

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const memo = new Map<string, Promise<DeepLinks>>();

export function fetchDeepLinks(media: MediaType, tmdbId: number, title: string, year?: string): Promise<DeepLinks> {
  const key = `${media}:${tmdbId}`;
  const cached = memo.get(key);
  if (cached) return cached;

  const q = new URLSearchParams({ title, tmdbId: String(tmdbId), type: media });
  if (year) q.set("year", year);
  const p = fetch(`/api/deeplink?${q.toString()}`)
    .then((r) => (r.ok ? r.json() : { links: {} }))
    .then((d) => (d?.links || {}) as DeepLinks)
    .catch(() => ({} as DeepLinks));
  memo.set(key, p);
  return p;
}

/** Find the exact-title deep link for a TMDB provider name, if JustWatch had one. */
export function deepLinkFor(providerName: string, links?: DeepLinks): string | undefined {
  if (!links) return undefined;
  const n = norm(providerName);
  if (!n) return undefined;
  const safe = (u?: string) => (u && u.startsWith("https://") ? u : undefined); // href guard (defense in depth)
  if (links[n]) return safe(links[n]);
  // Tolerate naming drift ("Tubi TV" vs "Tubi", "Peacock Premium" vs "Peacock",
  // "Disney Plus" vs "Disney+", "Amazon Prime Video" vs "Prime Video"). Prefix match,
  // plus a substring match gated to names ≥5 chars so a pill's own service name
  // ("Prime Video") still finds JustWatch's "amazonprimevideo" key — while short names
  // never cross-match (e.g. "Max" must not grab "Cinemax").
  const k = Object.keys(links).find(
    (key) =>
      key.startsWith(n) ||
      n.startsWith(key) ||
      (n.length >= 5 && (key.includes(n) || n.includes(key)))
  );
  return k ? safe(links[k]) : undefined;
}
