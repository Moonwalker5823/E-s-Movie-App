// Vercel serverless function — the video engine behind the Sports "Highlights"
// hub AND the Smokers Lounge "Bud TV" hub.
//
// Pulls the latest uploads from curated YouTube channels via their public RSS
// feeds (no API key, no quota) and returns them as JSON, newest first. The browser
// calls this same-origin, so there's no CORS issue (YouTube RSS itself isn't
// CORS-enabled, which is why we proxy it here). Channel IDs were verified live.
//
// Runs on Vercel and under `vercel dev`. Under plain `vite dev` there's no
// serverless runtime, so the hubs show a friendly "loads on the live site" note.

interface Channel {
  id: string;
  name: string;
}

// League / highlight channels.
const NFL = { id: "UCJdl3Paao2f3ha5JXMYUCIA", name: "NFL" };
const NBA = { id: "UCWJ2lWNubArHWmf3FIHbfcQ", name: "NBA" };
const MLB = { id: "UCoLrcjPV5PbUrUyXq5mjc_A", name: "MLB" };
const NHL = { id: "UCK3CHl-6e3hq4gQaz_TOyoQ", name: "NHL" };
const EPL = { id: "UCpryVRk_VDudG8SHXgWcG0w", name: "Premier League" };
const ESPN = { id: "UCiio0ydw439X13KyZgMIcHw", name: "ESPN" };
const HOH = { id: "UC5qUhMoqke0mnJtgVoEn0aw", name: "House of Highlights" };
const BR = { id: "UCO7BZhCe-EJxXIOU_O53n9g", name: "Bleacher Report" };

// Music-video channels (verified active, July 2026).
const NPR_MUSIC = { id: "UC4eYXhJI4-7wSWc8UNRwD4A", name: "NPR Music" }; // Tiny Desk — lyrical/soul/R&B live
const COLORS = { id: "UC2Qw1dzXDBAZPwS7zm37g8g", name: "COLORS" }; // curated lyrical / neo-soul / global
const MASS_APPEAL = { id: "UCerm0xrYv04HvPd_G5ZLN0w", name: "Mass Appeal" }; // elevated / golden-era hip-hop
const MJ = { id: "UC5OrDvL9DscpcAstz7JnQGA", name: "Michael Jackson" }; // the King (above all)
const RNB_NATION = { id: "UCRrCiR_F-olJgMClfsl7YAg", name: "R&B Nation" }; // R&B / soul
const LEGACY = { id: "UCf7g15p1fY26A0ZsGlX_6tA", name: "Legacy Recordings" }; // classic rock / soul catalog

// A curated set of channels for each hub tab. Verified active (2026 uploads).
const SETS: Record<string, Channel[]> = {
  // Sports "Highlights" tabs
  all: [HOH, ESPN, BR, NFL, NBA, MLB, NHL],
  nfl: [NFL],
  nba: [NBA, HOH],
  mlb: [MLB],
  nhl: [NHL],
  soccer: [EPL],
  cfb: [ESPN],
  // Sports "Shows" — highlights-alternative podcasts (The Pivot, KG Certified, …)
  shows: [
    { id: "UCUnxiP7q4RDDyeioZFZLnXA", name: "The Pivot" },
    { id: "UC2ozVs4pg2K3uFLw6-0ayCQ", name: "KG Certified" },
    { id: "UCMJAKnrVv1sRzlq_vqige3Q", name: "All The Smoke" },
    { id: "UCVRm2Ho8cL3lvWDyp2ayuFw", name: "New Heights" },
    { id: "UCnKhvsJ8d1zEFWH7axtc7ew", name: "Gil's Arena" },
    { id: "UCBNqqomXKPSWvcQDXOkRvRA", name: "Draymond Green Show" },
    { id: "UCKnodHJpZd8UbSvAufDd3_g", name: "Club Shay Shay" },
  ],
  // Smokers Lounge "Bud TV" — Snoop's GGN, Smoke Box, weed vlogs.
  weed: [
    { id: "UC-OO324clObi3H-U0bP77dw", name: "Snoop Dogg (GGN)" },
    { id: "UCSDxHir7pmMTmJ_-tlK7NHA", name: "BREAL.TV" },
    { id: "UCxhC-uVCAqX-dSmYwj-U18Q", name: "Macdizzle420" },
  ],
  // Blerd — the black nerd in you: science, tech, TED, ancient aliens, code.
  blerd: [
    { id: "UCG7J20LhUeLl6y_Emi7OJrA", name: "Marques Brownlee" },
    { id: "UCsT0YIqwnpJCM-mx7-gSA4Q", name: "TED" },
    { id: "UCin0m13qWv3-051xlWlHamA", name: "Veritasium" },
    { id: "UCq8ZAAsI89IoJ-fn1gYpO3g", name: "Kurzgesagt" }, // was HISTORY (posts true-crime); keep the Mix pure nerd
    { id: "UCUyeluBRhGPCW4rPe_UvBZQ", name: "ThePrimeagen" },
  ],
  science: [
    { id: "UCin0m13qWv3-051xlWlHamA", name: "Veritasium" },
    { id: "UCq8ZAAsI89IoJ-fn1gYpO3g", name: "Kurzgesagt" },
    { id: "UCq6OAftTQOuUBRdtUDq5SUA", name: "PBS Space Time" },
    { id: "UC9SM7V7J1pAhPabOUST01fw", name: "NASA" },
    { id: "UCoxcjq-8xIDTYp3uz647V5A", name: "Computerphile" },
  ],
  tech: [
    { id: "UCG7J20LhUeLl6y_Emi7OJrA", name: "Marques Brownlee" },
    { id: "UCddiUEpeqJcYeBxX1IVBKvQ", name: "The Verge" },
    { id: "UCdBK94H6oZT2Q7l0-b0xmMg", name: "Linus Tech Tips" },
  ],
  ted: [{ id: "UCsT0YIqwnpJCM-mx7-gSA4Q", name: "TED" }],
  aliens: [{ id: "UCNIFiHaLZkYASaWDdkC1njg", name: "HISTORY" }],
  code: [
    { id: "UCUyeluBRhGPCW4rPe_UvBZQ", name: "ThePrimeagen" },
    { id: "UC1emV4A8liRs9p80CY8ElUQ", name: "freeCodeCamp" },
    { id: "UC2Xd-TjJByJyK2w1zNwY0zQ", name: "Fireship" },
  ],
  // Music — a grown, golden-era, lyrical/soul palette (curated channels only, no
  // ratchet or drill). Tidal covers the personalized / deep-catalog library.
  music: [COLORS, NPR_MUSIC, MASS_APPEAL, RNB_NATION, MJ, LEGACY],
  rnb: [RNB_NATION, COLORS, NPR_MUSIC],
  hiphop: [MASS_APPEAL, COLORS, NPR_MUSIC], // lyrical / golden-era — no ratchet or drill
  classics: [MJ, LEGACY], // MJ + classic soul/rock catalog (Black rock, throwbacks)
  tinydesk: [NPR_MUSIC],
  // Games — gaming clips, trailers & shorts.
  gaming: [
    { id: "UCydtMNspoPAlqBjFSGnigSw", name: "Xbox" },
    { id: "UCBsbrudhKRrT9zs8iNOEjjw", name: "PlayStation" },
    { id: "UC5CE6nbu1tjSGha-a_cHAFA", name: "GameSpot" },
    { id: "UCg5bOg1qVoZ2JDJ7MmjY63A", name: "Kotaku" },
  ],
};

const MAX_SHORT_SEC = 300; // "shorts" = 5 minutes or under

// Blerd is nerd turf. The HISTORY channel (our Ancient Aliens source) also uploads
// true-crime / murder / investigative docs — filter those out by title so the
// "aliens" tab stays ancient-mysteries, not murder. Only applied to HISTORY-sourced
// tabs so tech "iPhone killer" headlines aren't caught.
const CRIME_SETS = new Set(["aliens"]);
// True-crime / murder / investigative stems. Note: NO bare "abduction" — "alien
// abduction" is core Ancient Aliens; and no "massacre"/"slain" (ancient-battle
// false positives). Scoped to CRIME_SETS so tech "iPhone killer" headlines etc. are
// never touched.
const CRIME_RE =
  /\b(murder\w*|homicides?|killers?|serial killers?|true crime|crime scene|cold cases?|manhunt|death row|kidnapp?\w*|assassin\w*|investigat\w*|detectives?|forensics?|stalkers?|killing spree|psychopath|who killed)\b/i;

interface Item {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
  durationSec?: number;
}

const cache: Record<string, { at: number; items: Item[] }> = ((globalThis as any).__vidCache ||= {});
const TTL = 15 * 60 * 1000; // 15 min

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseFeed(xml: string, channel: string): Item[] {
  return xml
    .split("<entry>")
    .slice(1)
    .map((e) => {
      const videoId = (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1] || "";
      const title = (e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "";
      const published = (e.match(/<published>(.*?)<\/published>/) || [])[1] || "";
      if (!videoId) return null;
      return {
        videoId,
        title: decode(title),
        published,
        channel,
        thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      } as Item;
    })
    .filter((x): x is Item => x !== null);
}

// ISO-8601 duration (PT#H#M#S) → seconds.
function isoToSec(d?: string): number | null {
  const m = (d || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

// Look up video durations. Uses the YouTube Data API when YOUTUBE_API_KEY is set
// (reliable, 1 call per 50 ids); otherwise falls back to scraping lengthSeconds
// from the watch page (keyless, best-effort). Returns a videoId → seconds map.
async function durationsFor(ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const key = process.env.YOUTUBE_API_KEY;

  if (key) {
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      try {
        const r = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${key}`
        );
        const data = await r.json();
        for (const it of data.items || []) {
          const s = isoToSec(it.contentDetails?.duration);
          if (s != null) out[it.id] = s;
        }
      } catch {
        /* ignore — best effort */
      }
    }
    return out;
  }

  await Promise.all(
    ids.slice(0, 16).map(async (id) => {
      try {
        const r = await fetch(`https://www.youtube.com/watch?v=${id}`, {
          headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en", cookie: "SOCS=CAI;" },
        });
        const m = (await r.text()).match(/"lengthSeconds":"(\d+)"/);
        if (m) out[id] = Number(m[1]);
      } catch {
        /* ignore */
      }
    })
  );
  return out;
}

export default async function handler(req: any, res: any) {
  const set = (req.query?.set || "all").toString().toLowerCase();
  const short = String(req.query?.short || "") === "1";
  const channels = SETS[set] || SETS.all;
  const cacheKey = short ? `${set}:short` : set;

  const hit = cache[cacheKey];
  if (hit && Date.now() - hit.at < TTL) {
    res.status(200).json({ items: hit.items, cached: true });
    return;
  }

  const lists = await Promise.all(
    channels.map(async (c) => {
      try {
        const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${c.id}`);
        if (!r.ok) return [] as Item[];
        return parseFeed(await r.text(), c.name);
      } catch {
        return [] as Item[];
      }
    })
  );

  const seen = new Set<string>();
  let items = lists
    .flat()
    .filter((it) => (seen.has(it.videoId) ? false : (seen.add(it.videoId), true)))
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 48);

  // Shorts-only tabs (Lounge / Blerd / Games): keep clips 5 min and under.
  // If duration lookup is unavailable (e.g. rate-limited), fall back to unfiltered
  // so the hub is never empty.
  if (short) {
    const durs = await durationsFor(items.slice(0, 24).map((i) => i.videoId));
    if (Object.keys(durs).length > 0) {
      items = items
        .filter((i) => durs[i.videoId] != null && durs[i.videoId] <= MAX_SHORT_SEC)
        .map((i) => ({ ...i, durationSec: durs[i.videoId] }));
    }
  }

  // Keep true-crime / murder content off the Blerd nerd tabs.
  if (CRIME_SETS.has(set)) items = items.filter((i) => !CRIME_RE.test(i.title));

  cache[cacheKey] = { at: Date.now(), items };
  res.status(200).json({ items });
}
