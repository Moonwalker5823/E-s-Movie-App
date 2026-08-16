import { useSyncExternalStore } from "react";
import {
  yahooLeague,
  yahooMine,
  yahooStatus,
  YahooError,
  type YahooErrorCode,
  type YahooLeague,
  type YahooMyTeam,
} from "../../api/yahoo";

// The live Yahoo connection for the Fantasy section: is it usable, which league/team is
// Eric's, and which week the UI is showing. Same store pattern as league.ts / team.ts
// (useSyncExternalStore + localStorage).
//
// Yahoo mints a NEW league id every season, so nothing here is hardcoded — the league and
// team keys are discovered from the signed-in account and cached, then re-checked on a
// 6h TTL so a rollover (or a week flip) picks itself up without a code change.

const KEY = "ema.fantasy.yahoo.v1";
const TTL = 6 * 60 * 60 * 1000;

// The Jones Family League's Yahoo league id — stable across seasons even though the full
// key ("nfl.l.<id>" → "<gameKey>.l.<id>") is not. Only used to pick the right team when
// the account manages more than one league.
const HOME_LEAGUE_ID = "1261152";

export type YahooState =
  | "idle" // nothing attempted yet
  | "loading"
  | "ready" // league + team resolved, live data will work
  | "off" // expected + explainable: not configured / not signed in / no serverless runtime
  | "error"; // unexpected upstream failure

export interface YahooConnection {
  state: YahooState;
  code?: YahooErrorCode;
  message?: string;
  league: YahooLeague | null;
  myTeam: YahooMyTeam | null;
  /** The week the Fantasy UI is showing — starts at the league's current week. */
  week: number;
}

interface Persisted {
  at: number;
  league: YahooLeague;
  myTeam: YahooMyTeam;
}

function hydrate(): YahooConnection {
  const empty: YahooConnection = { state: "idle", league: null, myTeam: null, week: 0 };
  try {
    const c: Persisted | null = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!c?.league?.leagueKey || !c?.myTeam?.teamKey) return empty;
    // Render the cached league instantly on boot; connect() still refreshes behind it.
    return { state: "ready", league: c.league, myTeam: c.myTeam, week: c.league.currentWeek || 1 };
  } catch {
    return empty;
  }
}

let state: YahooConnection = hydrate();
let cachedAt: number = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null")?.at || 0;
  } catch {
    return 0;
  }
})();

const listeners = new Set<() => void>();

function commit(next: YahooConnection) {
  state = next;
  listeners.forEach((l) => l());
}

function persist(league: YahooLeague, myTeam: YahooMyTeam) {
  cachedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: cachedAt, league, myTeam } satisfies Persisted));
  } catch {
    /* quota — keep it in memory only */
  }
}

export function useYahoo(): YahooConnection {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

export const getYahoo = () => state;

// Set once the user steps off the live week, so a background refresh doesn't yank them
// back to "now" mid-browse. Session-only: a reload follows Yahoo's current week again.
let weekPinned = false;

/** Show a different week (clamped to the league's own schedule). */
export function setYahooWeek(week: number) {
  const lo = state.league?.startWeek || 1;
  const hi = state.league?.endWeek || 18;
  weekPinned = true;
  commit({ ...state, week: Math.max(lo, Math.min(hi, Math.round(week))) });
}

let inflight: Promise<void> | null = null;

/** Resolve the connection: configured → signed in → which team → league meta. Safe to
 *  call from every mount; it dedupes in flight and no-ops while the cache is fresh. */
export function connectYahoo(force = false): Promise<void> {
  if (inflight) return inflight;
  if (!force && state.state === "ready" && Date.now() - cachedAt < TTL) return Promise.resolve();

  const off = (code: YahooErrorCode, message: string) =>
    commit({ ...state, state: "off", code, message, league: null, myTeam: null });

  inflight = (async () => {
    // Keep any cached league on screen while re-checking, so a refresh never blanks the UI.
    commit({ ...state, state: state.league ? state.state : "loading", code: undefined, message: undefined });
    try {
      const status = await yahooStatus();
      if (!status.configured) {
        off("not_configured", "Yahoo isn't set up on the server yet.");
        return;
      }
      if (!status.connected) {
        off("not_connected", "Sign in to Yahoo once to turn on live league data.");
        return;
      }

      const { teams } = await yahooMine();
      if (!teams.length) {
        off("not_connected", "That Yahoo account doesn't manage an NFL team this season.");
        return;
      }
      const myTeam = teams.find((t) => t.leagueKey.endsWith(`.l.${HOME_LEAGUE_ID}`)) || teams[0];

      const league = await yahooLeague(myTeam.leagueKey);
      persist(league, myTeam);
      commit({
        state: "ready",
        league,
        myTeam,
        // Follow Yahoo's current week unless the user has stepped to another one.
        week: weekPinned && state.week ? state.week : league.currentWeek || 1,
      });
    } catch (e) {
      const err = e instanceof YahooError ? e : null;
      // "unavailable" is the normal local-dev case (no serverless runtime) — not an error
      // worth shouting about, so it lands in the same quiet "off" state.
      if (err && (err.code === "unavailable" || err.code === "not_configured" || err.code === "not_connected")) {
        off(err.code, err.message);
        return;
      }
      commit({
        ...state,
        state: state.league ? "ready" : "error", // a stale league still beats an error screen
        code: err?.code || "yahoo_error",
        message: err?.message || "Couldn't reach Yahoo.",
      });
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Human-readable record, e.g. "7-4" or "7-4-1". */
export function recordOf(t: { wins: number; losses: number; ties: number }): string {
  return t.ties > 0 ? `${t.wins}-${t.losses}-${t.ties}` : `${t.wins}-${t.losses}`;
}

/** 1 → "1st". Yahoo gives a plain rank; the UI wants it ordinal. */
export function ordinal(n: number): string {
  if (!n) return "—";
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
}
