// Vercel serverless function — resolves EXACT per-title streaming deep links.
//
// TMDB tells us WHICH services carry a title, but not the per-title URL, so the
// best the app could do on its own was open a service's search page. On the TV,
// several apps mis-handle a bare search hand-off — Hulu in particular throws
// "there was an error playing this video. please try searching directly for it."
//
// JustWatch (the data source behind TMDB's own "watch providers") does expose the
// real content URLs — e.g. hulu.com/watch/<id> and watch.amazon.com/detail?gti=<id>
// — which the TV apps resolve straight to the exact title (Prime even auto-plays).
// We match on TMDB id so we always link the right title/year, and fall back to a
// search URL (handled client-side) when JustWatch has no offer.
//
// Runs on Vercel and under `vercel dev`. Under plain `vite dev` there's no
// serverless runtime, so the client just uses its search-URL fallback.

const JW_ENDPOINT = "https://apis.justwatch.com/graphql";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

const QUERY = `query DeepLinks($country:Country!,$language:Language!,$first:Int!,$filter:TitleFilter){
  popularTitles(country:$country,first:$first,filter:$filter){
    edges{node{
      objectType
      content(country:$country,language:$language){ title originalReleaseYear externalIds{ tmdbId } }
      offers(country:$country,platform:WEB){ monetizationType package{ clearName technicalName } standardWebURL }
    }}
  }
}`;

// Prefer "watch it now" offers over rent/buy when a provider has several.
const RANK: Record<string, number> = { FLATRATE: 0, FREE: 1, ADS: 2, CINEMA: 3, FLATRATE_AND_BUY: 0, RENT: 4, BUY: 5 };

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

interface Offer {
  monetizationType: string;
  package: { clearName: string; technicalName: string };
  standardWebURL: string;
}
interface Node {
  objectType: string;
  content: { title: string; originalReleaseYear?: number; externalIds?: { tmdbId?: string } };
  offers: Offer[];
}

const cache: Record<string, { at: number; body: any }> = ((globalThis as any).__deeplinkCache ||= {});
const TTL = 6 * 60 * 60 * 1000; // 6h — deep links are stable

export default async function handler(req: any, res: any) {
  const title = (req.query?.title || "").toString();
  const tmdbId = (req.query?.tmdbId || "").toString();
  const type = (req.query?.type || "").toString(); // "movie" | "tv"
  const year = Number(req.query?.year || 0);
  if (!title) {
    res.status(400).json({ links: {}, error: "title required" });
    return;
  }

  const cacheKey = `${type}:${tmdbId}:${norm(title)}`;
  const hit = cache[cacheKey];
  if (hit && Date.now() - hit.at < TTL) {
    res.status(200).json({ ...hit.body, cached: true });
    return;
  }

  let nodes: Node[] = [];
  try {
    const r = await fetch(JW_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": UA, origin: "https://www.justwatch.com" },
      body: JSON.stringify({
        operationName: "DeepLinks",
        variables: { country: "US", language: "en", first: 8, filter: { searchQuery: title } },
        query: QUERY,
      }),
    });
    const data = await r.json();
    nodes = (data?.data?.popularTitles?.edges || []).map((e: any) => e.node).filter(Boolean);
  } catch {
    /* JustWatch unreachable — client falls back to its search URL */
  }

  const wantType = type === "tv" ? "SHOW" : type === "movie" ? "MOVIE" : null;

  // Pick the exact title: TMDB id is authoritative; otherwise match type + name
  // (+ year when we have it), else the first result that actually has offers.
  const byTmdb = tmdbId ? nodes.find((n) => n.content?.externalIds?.tmdbId === tmdbId) : undefined;
  const byMeta = nodes.find(
    (n) =>
      (!wantType || n.objectType === wantType) &&
      norm(n.content?.title) === norm(title) &&
      (!year || !n.content?.originalReleaseYear || Math.abs(n.content.originalReleaseYear - year) <= 1)
  );
  const node = byTmdb || byMeta || nodes.find((n) => (n.offers || []).length > 0) || null;

  // One best URL per provider, keyed by a normalized service name the client can
  // match against a TMDB provider name.
  const links: Record<string, string> = {};
  const bestRank: Record<string, number> = {};
  for (const o of node?.offers || []) {
    if (!o?.standardWebURL || !o.package) continue;
    const key = norm(o.package.clearName) || norm(o.package.technicalName);
    if (!key) continue;
    const rank = RANK[o.monetizationType] ?? 9;
    if (bestRank[key] === undefined || rank < bestRank[key]) {
      bestRank[key] = rank;
      links[key] = o.standardWebURL;
    }
  }

  const body = { links, matched: byTmdb ? "tmdb" : byMeta ? "meta" : node ? "loose" : "none" };
  cache[cacheKey] = { at: Date.now(), body };
  res.status(200).json(body);
}
