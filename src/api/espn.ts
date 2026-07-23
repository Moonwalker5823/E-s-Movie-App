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
