import { useSyncExternalStore } from "react";

export type Landing = "home" | "browse";

export interface Settings {
  landing: Landing;
  myServices: string[]; // service keys the user subscribes to
  leagues: { yahoo?: string; espn?: string };
  accessCode?: string; // sent to the AI endpoint when it's gated
}

const KEY = "ema.settings.v1";
const DEFAULTS: Settings = {
  landing: "home",
  myServices: ["hulu", "prime", "tubi"], // Eric's services by default
  leagues: {},
};

function read(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

let state: Settings = read();
const listeners = new Set<() => void>();

function commit(next: Settings) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

// Non-reactive read (for routing / one-off checks).
export const getSettings = () => state;

export function setLanding(landing: Landing) {
  commit({ ...state, landing });
}

export function toggleService(key: string) {
  const has = state.myServices.includes(key);
  commit({
    ...state,
    myServices: has ? state.myServices.filter((k) => k !== key) : [...state.myServices, key],
  });
}

export function hasService(key: string | null): boolean {
  return key ? state.myServices.includes(key) : false;
}

export function setLeague(which: "yahoo" | "espn", url: string) {
  commit({ ...state, leagues: { ...state.leagues, [which]: url } });
}

export function setAccessCode(code: string) {
  commit({ ...state, accessCode: code });
}
