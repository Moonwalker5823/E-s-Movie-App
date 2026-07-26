import type { Player, RosterSettings } from "../types";
import type { ProviderId, ScoringSettings } from "../league";

// A pluggable live-data source for a fantasy league. Sleeper implements all of it for
// free; manual/ESPN implement only what they can. Every method is optional so a caller
// checks `caps` (or the method's presence) before using it and falls back gracefully.

export interface TrendingPlayer {
  sleeperId: string; // resolve against the board id `slp-${sleeperId}`
  count: number; // # of adds/drops in the lookback window
}

export interface ProviderRoster {
  rosterId: number;
  ownerId: string;
  ownerName?: string;
  playerIds: string[]; // provider player ids
  starters?: string[];
}

export interface Matchup {
  rosterId: number;
  matchupId: number;
  points: number;
  starters: string[];
}

export interface LeagueMeta {
  name: string;
  teams: number;
  season: string;
  scoringHint?: Partial<ScoringSettings>;
  rosterHint?: Partial<RosterSettings>;
}

export interface LeagueProvider {
  id: ProviderId;
  caps: { players: boolean; trending: boolean; leagueSync: boolean };
  fetchPlayers?(): Promise<Player[]>;
  fetchTrending?(kind: "add" | "drop", limit?: number): Promise<TrendingPlayer[]>;
  resolveUser?(username: string): Promise<string | null>;
  fetchLeague?(leagueId: string): Promise<LeagueMeta | null>;
  fetchUsers?(leagueId: string): Promise<Record<string, string>>; // userId -> display name
  fetchRosters?(leagueId: string): Promise<ProviderRoster[]>;
  fetchMatchups?(leagueId: string, week: number): Promise<Matchup[]>;
}
