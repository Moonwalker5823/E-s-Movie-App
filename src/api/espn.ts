export interface Team {
  displayName: string;
  abbreviation: string;
  logo?: string;
  score?: string;
  winner?: boolean;
}

export interface Game {
  id: string;
  date: string;
  state: "pre" | "in" | "post";
  statusDetail: string;
  home: Team;
  away: Team;
  broadcasts: string[];
  venue?: string;
  league?: string; // set on the "Live" tab, which mixes games across leagues
}

export interface League {
  key: string;
  label: string;
  path: string; // sport/league
}

export const LEAGUES: League[] = [
  { key: "nfl", label: "NFL", path: "football/nfl" },
  { key: "nba", label: "NBA", path: "basketball/nba" },
  { key: "mlb", label: "MLB", path: "baseball/mlb" },
  { key: "nhl", label: "NHL", path: "hockey/nhl" },
  { key: "cfb", label: "CFB", path: "football/college-football" },
  { key: "epl", label: "Soccer", path: "soccer/eng.1" },
];

export interface TeamInfo {
  name: string;
  logo?: string;
  color?: string;
  record: string;
  standing?: string;
  nextName?: string;
  nextDate?: string;
  nextBroadcast?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function teamInfo(path: string, id: string): Promise<TeamInfo> {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/teams/${id}`);
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  const t = (await res.json())?.team || {};
  const next = t.nextEvent?.[0];
  const comp = next?.competitions?.[0];
  const broadcast = comp?.broadcasts?.[0]?.media?.shortName || comp?.geoBroadcasts?.[0]?.media?.shortName;
  return {
    name: t.displayName || "Team",
    logo: t.logos?.[0]?.href,
    color: t.color ? `#${t.color}` : undefined,
    record: t.record?.items?.[0]?.summary || "—",
    standing: t.standingSummary,
    nextName: next?.shortName || next?.name,
    nextDate: next?.date,
    nextBroadcast: broadcast,
  };
}

// ── Sports rail: cycle through EVERY category ──────────────────────────────────
// The rail auto-rotates through each game/event across all these leagues (skipping
// any with nothing on). Three shapes: `team` (two teams + score), `combat` (a fight
// card — two fighters, no running score), `racing` (a field of drivers → podium).
export type RailKind = "team" | "combat" | "racing";

export interface RailLeague {
  key: string;
  label: string;
  path: string; // sport/league for the ESPN scoreboard
  kind: RailKind;
}

export const RAIL_LEAGUES: RailLeague[] = [
  { key: "nfl", label: "NFL", path: "football/nfl", kind: "team" },
  { key: "nba", label: "NBA", path: "basketball/nba", kind: "team" },
  { key: "mlb", label: "MLB", path: "baseball/mlb", kind: "team" },
  { key: "nhl", label: "NHL", path: "hockey/nhl", kind: "team" },
  { key: "cfb", label: "CFB", path: "football/college-football", kind: "team" },
  { key: "epl", label: "Soccer", path: "soccer/eng.1", kind: "team" },
  { key: "ufc", label: "UFC", path: "mma/ufc", kind: "combat" },
  { key: "f1", label: "F1", path: "racing/f1", kind: "racing" },
  { key: "indy", label: "IndyCar", path: "racing/irl", kind: "racing" },
  // Boxing isn't in ESPN's free API — it comes from TheSportsDB instead (boxingCards).
];

export interface ScoreSide {
  name: string;
  abbr?: string;
  logo?: string;
  score?: string;
  record?: string;
  winner?: boolean;
}

export interface ScoreCard {
  id: string;
  date: string; // ISO date of the game/event (used to keep only yesterday + today)
  league: string; // label, e.g. "NFL" / "UFC" / "F1"
  kind: RailKind;
  state: "pre" | "in" | "post";
  status: string; // short status/detail
  title: string; // "NE @ SEA" / fight-card name / race name
  sides: ScoreSide[]; // 2 for team/combat, 0 for racing
  standings: { who: string }[]; // racing podium / running order (top 3)
  stats: { label: string; value: string }[]; // extra stat lines when available
  note?: string; // venue / broadcast / circuit
}

// YYYYMMDD for today + offsetDays, in the device's local time (for ESPN's ?dates=).
function ymd(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}${`${d.getMonth() + 1}`.padStart(2, "0")}${`${d.getDate()}`.padStart(2, "0")}`;
}

function broadcastsOf(comp: any): string[] {
  const out: string[] = [];
  (comp.broadcasts || []).forEach((b: any) => (b.names || []).forEach((n: string) => out.push(n)));
  (comp.geoBroadcasts || []).forEach((b: any) => b.media?.shortName && out.push(b.media.shortName));
  return Array.from(new Set(out));
}

async function leagueCards(lg: RailLeague): Promise<ScoreCard[]> {
  // Team sports: ask ESPN for yesterday+today specifically, so we get last night's
  // finals AND today's slate — NOT the next in-season week (e.g. September NFL in
  // July). Racing/combat are weekly & sparse, so we take their current/next event and
  // let the date window in railScores() decide whether it's close enough to show.
  const q = lg.kind === "team" ? `?dates=${ymd(-1)}-${ymd(0)}` : "";
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${lg.path}/scoreboard${q}`);
  if (!res.ok) return [];
  const data = await res.json();
  const events = data.events || [];

  return events.map((ev: any): ScoreCard => {
    const comp = ev.competitions?.[0] || {};
    const state = (ev.status?.type?.state || "pre") as ScoreCard["state"];
    const status = ev.status?.type?.shortDetail || "";
    const bc = broadcastsOf(comp);
    const base = { id: ev.id, date: ev.date || "", league: lg.label, kind: lg.kind, state, status };

    if (lg.kind === "racing") {
      const field = (comp.competitors || []).slice().sort((a: any, b: any) => (a.order || 99) - (b.order || 99));
      const standings = state === "pre" ? [] : field.slice(0, 3).map((c: any) => ({ who: c.athlete?.displayName || c.athlete?.shortName || "—" }));
      return {
        ...base,
        title: ev.name || ev.shortName || lg.label,
        sides: [],
        standings,
        stats: [],
        note: comp.venue?.fullName || bc[0],
      };
    }

    if (lg.kind === "combat") {
      const bouts = ev.competitions || [];
      const main = bouts[bouts.length - 1] || comp; // last bout = main event
      const sides: ScoreSide[] = (main.competitors || []).map((c: any) => ({
        name: c.athlete?.displayName || c.athlete?.shortName || "TBD",
        record: c.records?.[0]?.summary,
        winner: c.winner,
      }));
      return {
        ...base,
        title: ev.shortName || ev.name || lg.label,
        sides,
        standings: [],
        stats: bouts.length > 1 ? [{ label: "Card", value: `${bouts.length} bouts` }] : [],
        note: comp.venue?.fullName || bc[0],
      };
    }

    // Team game.
    const cs = comp.competitors || [];
    const pick = (ha: string) => cs.find((c: any) => c.homeAway === ha) || {};
    const toSide = (c: any): ScoreSide => ({
      name: c.team?.shortDisplayName || c.team?.displayName || "TBD",
      abbr: c.team?.abbreviation,
      logo: c.team?.logo,
      score: c.score,
      record: c.records?.[0]?.summary,
      winner: c.winner,
    });
    const away = toSide(pick("away"));
    const home = toSide(pick("home"));
    const stats = (comp.leaders || [])
      .slice(0, 2)
      .map((L: any) => ({
        label: L.shortDisplayName || L.displayName || L.name || "",
        value: L.leaders?.[0] ? `${L.leaders[0].athlete?.shortName || ""} ${L.leaders[0].displayValue || ""}`.trim() : "",
      }))
      .filter((s: any) => s.label && s.value);
    return {
      ...base,
      title: `${away.abbr || away.name} @ ${home.abbr || home.name}`,
      sides: [away, home],
      standings: [],
      stats,
      note: bc[0] || comp.venue?.fullName,
    };
  });
}

// Boxing has no ESPN feed, so it comes from TheSportsDB (free). Fighters aren't in
// structured fields — they're in the event title ("A vs B") — so we split on "vs".
// Best-effort: any failure just drops boxing from the rail (skipped).
async function boxingCards(): Promise<ScoreCard[]> {
  const TSDB = "https://www.thesportsdb.com/api/v1/json/3";
  const LEAGUE = "4445"; // TheSportsDB "Boxing"
  const grab = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : { events: [] })).catch(() => ({ events: [] }));
  const [next, past] = await Promise.all([
    grab(`${TSDB}/eventsnextleague.php?id=${LEAGUE}`),
    grab(`${TSDB}/eventspastleague.php?id=${LEAGUE}`),
  ]);

  const toCard = (e: any, state: "pre" | "post"): ScoreCard => {
    const parts = String(e.strEvent || "").split(/\s+vs\.?\s+/i);
    const sides: ScoreSide[] = parts.length === 2 ? parts.map((p) => ({ name: p.trim() })) : [];
    let status = "Upcoming";
    if (state === "post") status = "Final";
    else if (e.dateEvent) {
      const [, m, d] = e.dateEvent.split("-");
      status = `${Number(m)}/${Number(d)}${e.strTime ? ` · ${String(e.strTime).slice(0, 5)}` : ""}`;
    }
    return {
      id: `box-${e.idEvent}`,
      date: e.dateEvent ? `${e.dateEvent}T12:00:00` : "", // noon-local so day classification is clean
      league: "Boxing",
      kind: "combat",
      state,
      status,
      title: e.strEvent || "Boxing",
      sides,
      standings: [],
      stats: [],
      note: e.strVenue || undefined,
    };
  };

  return [
    ...(next.events || []).slice(0, 4).map((e: any) => toCard(e, "pre")),
    ...(past.events || []).slice(0, 2).map((e: any) => toCard(e, "post")),
  ];
}

/** Every game/event across all rail leagues, live first, then upcoming, then final.
 *  Leagues that error or have nothing on simply contribute nothing (skipped). */
export async function railScores(): Promise<ScoreCard[]> {
  const lists = await Promise.all([
    ...RAIL_LEAGUES.map((lg) => leagueCards(lg).catch(() => [] as ScoreCard[])),
    boxingCards().catch(() => [] as ScoreCard[]),
  ]);
  // Keep ONLY yesterday + today (device-local) — last night's results and the day's
  // games. Anything scheduled further out (e.g. next month's races, the September NFL
  // slate) is dropped, so in July the rail is what's actually on (mostly MLB).
  const now = new Date();
  const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime(); // yesterday 00:00
  const endMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime(); // start of tomorrow (exclusive)
  const rank = (s: ScoreCard["state"]) => (s === "in" ? 0 : s === "pre" ? 1 : 2);
  return lists
    .flat()
    .filter((c) => {
      const t = c.date ? new Date(c.date).getTime() : NaN;
      return !Number.isNaN(t) && t >= startMs && t < endMs;
    })
    .sort((a, b) => rank(a.state) - rank(b.state));
}

/** Every game currently IN PROGRESS across all the main leagues, so the Sports
 *  "🔴 Live" tab shows whatever's on right now. Each game is tagged with its league
 *  label. Leagues that error or have nothing live simply contribute nothing. */
export async function liveGames(): Promise<Game[]> {
  const lists = await Promise.all(
    LEAGUES.map((l) =>
      scoreboard(l.path)
        .then((gs) => gs.map((g) => ({ ...g, league: l.label })))
        .catch(() => [] as Game[])
    )
  );
  return lists.flat().filter((g) => g.state === "in");
}

export async function scoreboard(path: string): Promise<Game[]> {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`);
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  const data = await res.json();

  return (data.events || []).map((ev: any): Game => {
    const comp = ev.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const findSide = (side: string) => competitors.find((c: any) => c.homeAway === side) || {};
    const toTeam = (c: any): Team => ({
      displayName: c.team?.displayName || "TBD",
      abbreviation: c.team?.abbreviation || "",
      logo: c.team?.logo,
      score: c.score,
      winner: c.winner,
    });
    const broadcasts: string[] = [];
    (comp.broadcasts || []).forEach((b: any) => (b.names || []).forEach((n: string) => broadcasts.push(n)));
    (comp.geoBroadcasts || []).forEach((b: any) => {
      if (b.media?.shortName) broadcasts.push(b.media.shortName);
    });

    return {
      id: ev.id,
      date: ev.date,
      state: ev.status?.type?.state || "pre",
      statusDetail: ev.status?.type?.shortDetail || "",
      home: toTeam(findSide("home")),
      away: toTeam(findSide("away")),
      broadcasts: Array.from(new Set(broadcasts)),
      venue: comp.venue?.fullName,
    };
  });
}
