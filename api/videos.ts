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
};

interface Item {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
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

export default async function handler(req: any, res: any) {
  const set = (req.query?.set || "all").toString().toLowerCase();
  const channels = SETS[set] || SETS.all;

  const hit = cache[set];
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
  const items = lists
    .flat()
    .filter((it) => (seen.has(it.videoId) ? false : (seen.add(it.videoId), true)))
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 48);

  cache[set] = { at: Date.now(), items };
  res.status(200).json({ items });
}
