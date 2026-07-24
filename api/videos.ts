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
// Named artists — official / VEVO channels, RSS-verified.
const JAYZ = { id: "UC_Bf08Y-3m6CMAvTms3EkKg", name: "JAY-Z" };
const NAS = { id: "UChE4aVxHHk5Mx9fZ2DaPJGw", name: "Nas" };
const DMX = { id: "UCQcTmBevae2jDeFEZ6VEQPw", name: "DMX" };
const BIG_DADDY_KANE = { id: "UC8YswipxhrINUUEbEAHcDNw", name: "Big Daddy Kane" };
const KENDRICK = { id: "UC3lBXcrKFnFAFkfVk5WuKcQ", name: "Kendrick Lamar" };
const JCOLE = { id: "UCnc6db-y3IU7CkT_yeVXdVg", name: "J. Cole" };
const LUPE = { id: "UC-zD8J0RLWy3mNB7EMmT7Rg", name: "Lupe Fiasco" };
const GAMBINO = { id: "UCjYO25ZVJT523TD1iYHzcbw", name: "Childish Gambino" };
const TEMS = { id: "UCWfi5ELXGAe-DCA6cOP3aNw", name: "Tems" };
// Golden-era 80s/90s "Yo! MTV Raps" artists (official / VEVO), RSS-verified.
const RUN_DMC = { id: "UCLPo8s1MY3FOzzSwWZP0ZvQ", name: "Run-DMC" };
const LL_COOL_J = { id: "UCJk8BhnzYy-KkQ34Q7oZu1Q", name: "LL COOL J" };
const TRIBE = { id: "UCkZ7qikT6yimOwi-eeSUo5g", name: "A Tribe Called Quest" };
const WU_TANG = { id: "UCl0q_XqiWDMA-Q9SzUO3y-Q", name: "Wu-Tang Clan" };
const TUPAC = { id: "UCA_-NVTKOlWgxgTWjqlzZlA", name: "2Pac" };
const BIGGIE = { id: "UCEtIDoDJlLsaj3OI0k7lWqw", name: "The Notorious B.I.G." };
const PUBLIC_ENEMY = { id: "UCM3jnzSbwV8mHsZB6DySbyw", name: "Public Enemy" };
const EPMD = { id: "UCawAeY_1dMrsOWW-WnvJfJQ", name: "EPMD" };
const BEASTIE_BOYS = { id: "UCpRUSBcRWUQZIj3_jWF19Dg", name: "Beastie Boys" };

// Gaming channels — first-party consoles + fun sports games + racing/cars.
// RSS-verified live (July 2026 uploads).
const XBOX = { id: "UCjBp_7RuDBUYbd1LegWEJ8g", name: "Xbox" };
const PLAYSTATION = { id: "UC-2Y8dQb0S6DtpxNgAKoJKA", name: "PlayStation" };
const FORZA = { id: "UCydtMNspoPAlqBjFSGnigSw", name: "Forza" }; // racing / cars
const ROCKET_LEAGUE = { id: "UCBjQwd62OJgixzW49TKGERg", name: "Rocket League" }; // cars + soccer
const EA_FC = { id: "UCoyaxd5LQSuP4ChkxK0pnZQ", name: "EA SPORTS FC" }; // soccer
const NBA_2K = { id: "UCYAJjqIukwm4r3GHEpJDhVw", name: "NBA 2K" }; // basketball
const EA_MADDEN = { id: "UCPpddbTbOr_uWWQT9Pw1rbA", name: "EA SPORTS Madden NFL" }; // football
const EA_SPORTS = { id: "UCcpK2UHpfhfc23SC8TU16BA", name: "EA SPORTS" };

// Car / motorsport — "Top Gear feels": car shows, reviews, and racing.
// RSS-verified live (July 2026 uploads).
const TOP_GEAR = { id: "UCjOl2AUblVmg2rA_cRgZkFg", name: "Top Gear" };
const GRAND_TOUR = { id: "UCZ1Sc5xjWpUnp_o_lUTkvgQ", name: "The Grand Tour" };
const CARWOW = { id: "UCUhFaUpnq31m6TNX2VKVSVA", name: "carwow" };
const DONUT = { id: "UCL6JmiMXKoXS6bpP1D3bk8g", name: "Donut Media" };
const F1 = { id: "UCB_qr75-ydFVKSF9Dmo6izg", name: "Formula 1" };
const NASCAR = { id: "UCuN9hYw2RpoAW8rZ3VK3isA", name: "NASCAR" };

// Anime — action / shonen leaning (Baki lives on Netflix Anime): official clips,
// trailers, and (where licensed) full episodes. RSS-verified live (2026 uploads).
const CRUNCHYROLL = { id: "UC6pGDc4bFGD1_36IKv3FnYg", name: "Crunchyroll" };
const NETFLIX_ANIME = { id: "UCBSs9x2KzSLhyyA9IKyt4YA", name: "Netflix Anime" }; // Baki
const MUSE_ASIA = { id: "UCGbshtvS9t-8CW11W7TooQg", name: "Muse Asia" };
const ADULT_SWIM = { id: "UCgPClNr5VSYC3syrDUIlzLw", name: "Adult Swim" }; // Toonami

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
  // Alien-inspired (not one specific show): UFOs, aliens, unexplained, alien worlds.
  aliens: [
    { id: "UCIFk2uvCNcEmZ77g0ESKLcQ", name: "The Why Files" }, // UFOs / aliens / unexplained
    { id: "UCweDKPSF65wRw5VHFUJYiow", name: "Curious Archive" }, // alien worlds / xenobiology
  ],
  code: [
    { id: "UCUyeluBRhGPCW4rPe_UvBZQ", name: "ThePrimeagen" },
    { id: "UC1emV4A8liRs9p80CY8ElUQ", name: "freeCodeCamp" },
    { id: "UC2Xd-TjJByJyK2w1zNwY0zQ", name: "Fireship" },
  ],
  // Music — a grown, golden-era, lyrical/soul palette (curated + named artists, no
  // ratchet or drill). Tidal covers the personalized / deep-catalog library.
  music: [MJ, KENDRICK, JAYZ, MASS_APPEAL, TEMS, NAS, COLORS, JCOLE, RNB_NATION, LUPE, NPR_MUSIC],
  golden: [JAYZ, NAS, DMX, BIG_DADDY_KANE, MASS_APPEAL], // 90s/00s classic hip-hop
  lyricists: [KENDRICK, JCOLE, LUPE, GAMBINO, MASS_APPEAL], // conscious / lyrical
  soul: [TEMS, RNB_NATION, COLORS, NPR_MUSIC], // R&B / neo-soul
  classics: [MJ], // the King — his catalog
  tinydesk: [NPR_MUSIC],
  // 80s/90s "Yo! MTV Raps" golden era — classic videos + Mass Appeal freestyles/interviews.
  yomtvraps: [RUN_DMC, LL_COOL_J, TRIBE, WU_TANG, TUPAC, BIGGIE, PUBLIC_ENEMY, BIG_DADDY_KANE, EPMD, BEASTIE_BOYS, MASS_APPEAL],
  // Games — video-game + CAR heavy. "Mix" blends games with car content; then
  // Xbox, car shows (Top Gear feels), racing (motorsport + racing games), and
  // sports games.
  gaming: [XBOX, FORZA, TOP_GEAR, ROCKET_LEAGUE, CARWOW, PLAYSTATION],
  xbox: [XBOX],
  cars: [TOP_GEAR, GRAND_TOUR, CARWOW, DONUT], // car shows & reviews — Top Gear feels
  racing: [F1, NASCAR, FORZA, ROCKET_LEAGUE], // motorsport + racing games
  gamesports: [EA_FC, NBA_2K, EA_MADDEN, ROCKET_LEAGUE, EA_SPORTS], // sports games
  anime: [CRUNCHYROLL, NETFLIX_ANIME, MUSE_ASIA, ADULT_SWIM], // action anime (Baki, etc.)
};

const MAX_SHORT_SEC = 300; // "shorts" = 5 minutes or under

// Blerd is nerd turf. The alien/unexplained channels occasionally drift into
// true-crime / murder / missing-persons mysteries — filter those out by title so
// the "aliens" tab stays alien-inspired, not murder. Scoped to this set so tech
// "iPhone killer" headlines etc. are never caught.
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

  // Shorts-only tabs (Lounge / Blerd / Games): prefer clips 5 min and under.
  // If duration lookup is unavailable (rate-limited) OR a feed has no short clips
  // (e.g. Snoop's GGN posts full show episodes), fall back to the full-length
  // uploads so the hub is never empty.
  if (short) {
    const durs = await durationsFor(items.slice(0, 24).map((i) => i.videoId));
    if (Object.keys(durs).length > 0) {
      const shorts = items
        .filter((i) => durs[i.videoId] != null && durs[i.videoId] <= MAX_SHORT_SEC)
        .map((i) => ({ ...i, durationSec: durs[i.videoId] }));
      if (shorts.length > 0) items = shorts; // else keep the full episodes as fallback
    }
  }

  // Keep true-crime / murder content off the Blerd nerd tabs.
  if (CRIME_SETS.has(set)) items = items.filter((i) => !CRIME_RE.test(i.title));

  cache[cacheKey] = { at: Date.now(), items };
  res.status(200).json({ items });
}
