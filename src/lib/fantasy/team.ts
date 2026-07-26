import { useSyncExternalStore } from "react";
import type { Player } from "./types";
import { myRoster, allPlayers } from "./draft";
import { getLeague } from "./league";
import { sleeperProvider } from "./providers/sleeper";

// Your SEASON roster — separate from the draft picks because it changes all year via
// adds/drops/trades. Stored as board player ids; resolved against the live board.

const KEY = "ema.fantasy.team.v1";

export interface TeamState {
  rosterIds: string[];
  source: "draft" | "manual" | "sleeper";
  lastSync?: number;
}

function read(): TeamState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    return { rosterIds: Array.isArray(raw.rosterIds) ? raw.rosterIds : [], source: raw.source || "manual", lastSync: raw.lastSync };
  } catch {
    return { rosterIds: [], source: "manual" };
  }
}

let state: TeamState = read();
const listeners = new Set<() => void>();

function commit(next: TeamState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function useTeam(): TeamState {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

export const getTeam = () => state;

/** Resolve the roster ids to Player objects. Resolves against the live board AND any
 *  custom "added on the fly" players from the draft (both id spaces), so nothing on your
 *  roster silently vanishes. */
export function teamRoster(): Player[] {
  const byId = new Map(allPlayers().map((p) => [p.id, p]));
  return state.rosterIds
    .map((id) => byId.get(id))
    .filter((p): p is Player => Boolean(p));
}

export function addPlayer(id: string) {
  if (state.rosterIds.includes(id)) return;
  commit({ ...state, rosterIds: [...state.rosterIds, id], source: state.source === "draft" ? "manual" : state.source });
}

export function dropPlayer(id: string) {
  commit({ ...state, rosterIds: state.rosterIds.filter((x) => x !== id) });
}

/** Seed the season roster from the draft you just did. */
export function importFromDraft() {
  const ids = myRoster().map((p) => p.id);
  commit({ rosterIds: ids, source: "draft", lastSync: Date.now() });
}

/** Replace the roster from a synced provider (Sleeper). */
export function setRosterFromProvider(ids: string[]) {
  commit({ rosterIds: ids, source: "sleeper", lastSync: Date.now() });
}

export function clearTeam() {
  commit({ rosterIds: [], source: "manual" });
}

/** Pull your roster from a connected Sleeper league (needs league ID + username). */
export async function syncSleeperRoster(): Promise<{ ok: boolean; msg: string }> {
  const conn = getLeague().connection;
  if (conn.provider !== "sleeper" || !conn.sleeperLeagueId) {
    return { ok: false, msg: "Set your Sleeper league ID in League Settings first." };
  }
  if (!conn.sleeperUser) {
    return { ok: false, msg: "Add your Sleeper username in League Settings so we can find your team." };
  }
  try {
    const [rosters, uid] = await Promise.all([
      sleeperProvider.fetchRosters!(conn.sleeperLeagueId),
      sleeperProvider.resolveUser!(conn.sleeperUser),
    ]);
    const mine = uid ? rosters.find((r) => r.ownerId === uid) : null;
    if (!mine) return { ok: false, msg: "Couldn't match your team — check your username and league ID." };
    setRosterFromProvider(mine.playerIds);
    return { ok: true, msg: `Synced ${mine.playerIds.length} players from Sleeper.` };
  } catch {
    return { ok: false, msg: "Sleeper sync failed — try again in a moment." };
  }
}
