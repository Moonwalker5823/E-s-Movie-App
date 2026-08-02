import type { Player, Pos } from "../types";
import { byeFor } from "../byeWeeks";
import { fetchWithTimeout } from "../../fetchTimeout";
import type { LeagueProvider, LeagueMeta, ProviderRoster, Matchup, TrendingPlayer } from "./types";

// Sleeper's public read API — free, no auth, CORS-open (same direct-fetch approach as
// src/api/espn.ts). Global endpoints (players DB, trending) work for ANY league; the
// league-sync endpoints only apply when the user's league is actually on Sleeper.
const BASE = "https://api.sleeper.app/v1";

const POS_MAP: Record<string, Pos> = { QB: "QB", RB: "RB", WR: "WR", TE: "TE", K: "K", DEF: "DST" };

// One raw Sleeper player object → our Player, or null to drop it.
function toPlayer(raw: any): Player | null {
  const posRaw: string = raw.position || raw.fantasy_positions?.[0] || "";
  const pos = POS_MAP[posRaw];
  if (!pos) return null;

  const team: string = raw.team || (pos === "DST" ? raw.player_id : "") || "FA";
  // search_rank orders players by relevance; irrelevant guys get a huge/absent value.
  let rank: number | null = typeof raw.search_rank === "number" ? raw.search_rank : null;
  if (rank == null && (pos === "K" || pos === "DST")) rank = 250; // K/DST are streamed — park them low
  if (rank == null || rank >= 4000) return null;

  const name =
    pos === "DST"
      ? `${team} D/ST`
      : raw.full_name || [raw.first_name, raw.last_name].filter(Boolean).join(" ").trim();
  if (!name) return null;

  return {
    id: `slp-${raw.player_id}`,
    name,
    pos,
    team,
    bye: byeFor(team),
    adp: rank, // rank order stands in for ADP
    tier: Math.min(12, Math.max(1, Math.ceil(rank / 12))),
    searchRank: rank,
    status: raw.injury_status || (raw.status && raw.status !== "Active" ? raw.status : undefined) || undefined,
  };
}

async function getJson(url: string): Promise<any> {
  const r = await fetchWithTimeout(url);
  if (!r.ok) throw new Error(`sleeper ${r.status}`);
  return r.json();
}

export const sleeperProvider: LeagueProvider = {
  id: "sleeper",
  caps: { players: true, trending: true, leagueSync: true },

  // ~5 MB payload — fetched on demand only, then slimmed to the fantasy-relevant set and
  // cached by board.ts. Cap the list so the cached board stays well under the storage quota.
  async fetchPlayers(): Promise<Player[]> {
    const data = await getJson(`${BASE}/players/nfl`);
    return Object.values(data)
      .map(toPlayer)
      .filter((p): p is Player => p !== null)
      .sort((a, b) => a.adp - b.adp)
      .slice(0, 600);
  },

  async fetchTrending(kind: "add" | "drop", limit = 25): Promise<TrendingPlayer[]> {
    const data = await getJson(`${BASE}/players/nfl/trending/${kind}?lookback_hours=24&limit=${limit}`);
    return (Array.isArray(data) ? data : []).map((d: any) => ({ sleeperId: String(d.player_id), count: Number(d.count) || 0 }));
  },

  async resolveUser(username: string): Promise<string | null> {
    try {
      const u = await getJson(`${BASE}/user/${encodeURIComponent(username)}`);
      return u?.user_id || null;
    } catch {
      return null;
    }
  },

  async fetchLeague(leagueId: string): Promise<LeagueMeta | null> {
    try {
      const l = await getJson(`${BASE}/league/${leagueId}`);
      const s = l?.scoring_settings || {};
      return {
        name: l?.name || "League",
        teams: l?.total_rosters || 0,
        season: String(l?.season || ""),
        scoringHint: { rec: typeof s.rec === "number" ? s.rec : undefined },
      };
    } catch {
      return null;
    }
  },

  async fetchUsers(leagueId: string): Promise<Record<string, string>> {
    const arr = await getJson(`${BASE}/league/${leagueId}/users`).catch(() => []);
    const out: Record<string, string> = {};
    for (const u of arr || []) out[u.user_id] = u.metadata?.team_name || u.display_name || "Team";
    return out;
  },

  async fetchRosters(leagueId: string): Promise<ProviderRoster[]> {
    const arr = await getJson(`${BASE}/league/${leagueId}/rosters`).catch(() => []);
    return (arr || []).map((r: any) => ({
      rosterId: r.roster_id,
      ownerId: r.owner_id,
      playerIds: (r.players || []).map((id: string) => `slp-${id}`),
      starters: (r.starters || []).map((id: string) => `slp-${id}`),
    }));
  },

  async fetchMatchups(leagueId: string, week: number): Promise<Matchup[]> {
    const arr = await getJson(`${BASE}/league/${leagueId}/matchups/${week}`).catch(() => []);
    return (arr || []).map((m: any) => ({
      rosterId: m.roster_id,
      matchupId: m.matchup_id,
      points: Number(m.points) || 0,
      starters: (m.starters || []).map((id: string) => `slp-${id}`),
    }));
  },
};
