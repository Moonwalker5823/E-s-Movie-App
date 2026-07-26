import { useSyncExternalStore } from "react";
import { PLAYERS } from "../../data/players";
import type { Player } from "./types";
import { sleeperProvider } from "./providers/sleeper";

// The player board = a live Sleeper snapshot when available, else the static seed
// (src/data/players.ts). Sleeper's players DB is a free global source, so we use it for
// the board no matter which platform the league is on. Cached in localStorage with a
// 24h TTL and only refreshed on demand / first entry (the raw payload is ~5 MB).

const KEY = "ema.fantasy.players.v1";
const TTL = 24 * 60 * 60 * 1000;

interface BoardCache {
  at: number;
  players: Player[];
}

function readCache(): BoardCache | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c && Array.isArray(c.players) && c.players.length ? c : null;
  } catch {
    return null;
  }
}

let cache: BoardCache | null = readCache();
let refreshing = false;
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version++;
  listeners.forEach((l) => l());
}

/** The current board: live players if we have them, else the seed. */
export function getBoard(): Player[] {
  return cache && cache.players.length ? cache.players : PLAYERS;
}

export function boardMeta() {
  return {
    live: Boolean(cache && cache.players.length),
    fetchedAt: cache?.at ?? 0,
    count: getBoard().length,
    refreshing,
  };
}

export function isBoardStale(): boolean {
  return !cache || Date.now() - cache.at > TTL;
}

/** Pull a fresh board from Sleeper (free). Returns true on success. Best-effort: on any
 *  failure the existing board (live or seed) stays in place. */
export async function refreshBoard(): Promise<boolean> {
  if (refreshing) return false;
  refreshing = true;
  notify();
  try {
    const players = await sleeperProvider.fetchPlayers!();
    if (players.length) {
      cache = { at: Date.now(), players };
      try {
        localStorage.setItem(KEY, JSON.stringify(cache));
      } catch {
        /* quota — keep the fresh board in memory only */
      }
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    refreshing = false;
    notify();
  }
}

/** Subscribe to board changes (returns a version counter). Read data via getBoard()/boardMeta(). */
export function useBoard(): number {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => version
  );
}
