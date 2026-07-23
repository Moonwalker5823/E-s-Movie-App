import { useSyncExternalStore } from "react";

export type Landing = "home" | "browse";

export type LeagueKey = "yahoo" | "espn" | "sleeper";

// Philips Hue theater-lighting config. The user pairs their local bridge once;
// we store the bridge IP + app key and which room/scenes to drive. Color-follow
// is handled by the user's Hue Sync Box — the app only triggers scenes/dimming.
export interface HueConfig {
  bridgeIp?: string;
  user?: string; // Hue application key from link-button pairing
  groupId?: string; // room/zone to control ("0" = all lights)
  autoDimOnPlay?: boolean;
  scenes?: { play?: string; movie?: string; bright?: string };
}

export interface Settings {
  landing: Landing;
  myServices: string[]; // service keys the user subscribes to / is signed into
  leagues: Partial<Record<LeagueKey, string>>;
  accessCode?: string; // sent to the AI endpoint when it's gated
  hideX?: boolean; // hide the adult "X" tab from the nav
  hue?: HueConfig; // theater lighting
}

const KEY = "ema.settings.v1";
const DEFAULTS: Settings = {
  landing: "home",
  myServices: ["hulu", "prime", "tubi"], // Eric's services by default
  leagues: {},
  hideX: false,
  hue: {},
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

// Non-reactive read (for routing / one-off checks / the Hue client).
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

export function setLeague(which: LeagueKey, url: string) {
  commit({ ...state, leagues: { ...state.leagues, [which]: url } });
}

export function setAccessCode(code: string) {
  commit({ ...state, accessCode: code });
}

export function setHideX(hidden: boolean) {
  commit({ ...state, hideX: hidden });
}

// Merge a partial Hue config (nested `scenes` merges too).
export function setHue(patch: Partial<HueConfig>) {
  const prev = state.hue || {};
  commit({
    ...state,
    hue: { ...prev, ...patch, scenes: { ...prev.scenes, ...patch.scenes } },
  });
}
