// Scheduled warmer — keeps the durable last-known-good store seeded and fresh.
//
// WHY: /api/videos writes a KV fallback on every SUCCESSFUL fetch, so a set can only
// survive a throttle once it has succeeded at least once. Left to user traffic that's
// a race — you have to open a tab at a moment YouTube happens to cooperate, and the
// manual warming pass stalled at 12 of 43 because hammering the sets back-to-back
// provoked the very rate limiting it was insuring against.
//
// So: walk a SMALL slice every run instead. Spread thin enough that YouTube never sees
// a burst, the whole catalog cycles in a few hours, and anything still unseeded gets
// retried on the next pass through.
//
// It warms by calling the app's own /api/videos with the exact parameters the pages
// request. That reuses the real pipeline (fan-out, dedupe, filters, KV write-through)
// rather than duplicating it here, and has a useful property: if Vercel's edge already
// has a fresh copy the call is a cheap CDN hit that does no upstream work at all, and
// if it doesn't, the origin runs and seeds KV. Warming the real URLs also warms the
// edge cache users actually hit, so the first page load of the day is fast too.

// One entry per KV key. The key is `vid:lastgood:<set>[:short]` — `hours` is NOT part
// of it, so each set only needs warming once regardless of which page requests it.
// `hours` here just mirrors what the pages send so the edge cache gets warmed too.
const TARGETS: { set: string; hours: number; short?: boolean }[] = [
  // Sports (freshHours=3)
  { set: "all", hours: 3 }, { set: "wrap", hours: 3 }, { set: "pivot", hours: 3 },
  { set: "nfl", hours: 3 }, { set: "nba", hours: 3 }, { set: "mlb", hours: 3 },
  { set: "nhl", hours: 3 }, { set: "soccer", hours: 3 }, { set: "cfb", hours: 3 },
  { set: "podcasts", hours: 3 }, { set: "shows", hours: 3 }, { set: "and1", hours: 3 },
  // Home — The Mix player + the hub cards
  { set: "mix", hours: 3 },
  { set: "motors", hours: 12 }, { set: "gaming", hours: 12 }, { set: "music", hours: 12 },
  { set: "lounge", hours: 12 }, { set: "comedy", hours: 12 },
  // Music
  { set: "myplaylists", hours: 12 }, { set: "golden", hours: 12 }, { set: "yomtvraps", hours: 12 },
  { set: "lyricists", hours: 12 }, { set: "battlerap", hours: 12 }, { set: "soul", hours: 12 },
  { set: "classics", hours: 12 }, { set: "rock", hours: 12 }, { set: "tinydesk", hours: 12 },
  // Arcade / Lounge / Comedy
  { set: "xbox", hours: 12 },
  { set: "sessions", hours: 12 }, { set: "edibles", hours: 12 }, { set: "grow", hours: 12 },
  { set: "standup", hours: 12 }, { set: "skits", hours: 12 }, { set: "ridiculousness", hours: 12 },
  // Blerd requests with `short`, which is part of the KV key — these are distinct entries.
  { set: "blerd", hours: 12, short: true }, { set: "science", hours: 12, short: true },
  { set: "explore", hours: 12, short: true }, { set: "motivation", hours: 12, short: true },
  { set: "tech", hours: 12, short: true }, { set: "ted", hours: 12, short: true },
  { set: "aliens", hours: 12, short: true }, { set: "code", hours: 12, short: true },
  { set: "anime", hours: 12, short: true },
];

// Sized for cost, not speed. Every second of GAP_MS is billed function time (the
// lambda is awake, just waiting), so the gap is the smallest value that still reads as
// a trickle rather than a burst. 7 targets/run at hourly = the full catalog cycles
// roughly every 6 hours, which is plenty for a fallback store with a 7-day TTL.
const PER_RUN = 7;
const GAP_MS = 900;

export default async function handler(req: any, res: any) {
  res.setHeader("cache-control", "no-store");

  // Only Vercel's scheduler (or someone holding CRON_SECRET) may trigger this — it
  // makes real upstream requests, so an open endpoint would be a free way for anyone
  // to burn the Yahoo-style rate limit on our behalf.
  const secret = (process.env.CRON_SECRET || "").trim();
  const auth = (req.headers?.authorization || "").toString();
  const fromVercelCron = Boolean(req.headers?.["x-vercel-cron"]);
  const authorized = fromVercelCron || (secret !== "" && auth === `Bearer ${secret}`);
  if (!authorized) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const host = (req.headers?.["x-forwarded-host"] || req.headers?.host || "").toString();
  if (!host) {
    res.status(500).json({ error: "no_host" });
    return;
  }
  const proto = (req.headers?.["x-forwarded-proto"] || "https").toString().split(",")[0].trim();
  const base = `${proto}://${host}`;

  // Rotate by wall-clock so the slice advances every run without storing a cursor.
  // At one run per hour this walks the whole list in about six hours.
  const slice = Math.floor(Date.now() / (60 * 60 * 1000)) % Math.ceil(TARGETS.length / PER_RUN);
  const batch = TARGETS.slice(slice * PER_RUN, slice * PER_RUN + PER_RUN);

  const results: { set: string; items: number; stale?: boolean; error?: string }[] = [];
  for (const t of batch) {
    const url = `${base}/api/videos?set=${encodeURIComponent(t.set)}&hours=${t.hours}${t.short ? "&short=1" : ""}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const body = (await r.json()) as { items?: unknown[]; stale?: boolean };
      results.push({ set: t.set, items: body.items?.length ?? 0, stale: body.stale });
    } catch (e: any) {
      results.push({ set: t.set, items: 0, error: e?.name || "fetch_failed" });
    }
    await new Promise((ok) => setTimeout(ok, GAP_MS));
  }

  const seeded = results.filter((r) => r.items > 0 && !r.stale).length;
  res.status(200).json({ slice, warmed: results.length, freshlySeeded: seeded, results });
}
