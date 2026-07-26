import { useSyncExternalStore } from "react";
import type { RosterSettings } from "./types";

// League rules + connection config — the single source of truth every fantasy feature
// reads (draft needs, lineup slots, scoring, which live-data provider to use). Mirrors
// the settings.ts store pattern (useSyncExternalStore + localStorage). Family league is
// ~10-team Standard by default, but every field here is editable in the UI.

export type ScoringPreset = "standard" | "half" | "ppr" | "custom";

export interface ScoringSettings {
  preset: ScoringPreset;
  rec: number; // points per reception — the preset's defining knob (0 / 0.5 / 1)
  passYd: number;
  passTD: number;
  passInt: number;
  rushYd: number;
  rushTD: number;
  recYd: number;
  recTD: number;
  fumble: number;
}

export type ProviderId = "sleeper" | "espn" | "manual";

export interface Connection {
  provider: ProviderId;
  sleeperUser?: string;
  sleeperLeagueId?: string;
  espnLeagueId?: string;
  espnSeason?: number;
}

export interface LeagueState {
  teams: number;
  scoring: ScoringSettings;
  roster: RosterSettings;
  connection: Connection;
  currentWeek: number;
}

// Per-stat points shared by every preset; only `rec` changes between them.
const BASE_SCORING: Omit<ScoringSettings, "preset" | "rec"> = {
  passYd: 0.04, // 1 pt / 25 passing yds
  passTD: 4,
  passInt: -2,
  rushYd: 0.1, // 1 pt / 10 yds
  rushTD: 6,
  recYd: 0.1,
  recTD: 6,
  fumble: -2,
};

export const RECEPTION_POINTS: Record<Exclude<ScoringPreset, "custom">, number> = {
  standard: 0,
  half: 0.5,
  ppr: 1,
};

export const DEFAULT_ROSTER: RosterSettings = {
  QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0, K: 1, DST: 1, BENCH: 6,
};

export const DEFAULT_LEAGUE: LeagueState = {
  teams: 10, // family league, ~10 teams
  scoring: { preset: "standard", rec: 0, ...BASE_SCORING },
  roster: { ...DEFAULT_ROSTER },
  connection: { provider: "manual" },
  currentWeek: 1,
};

const KEY = "ema.fantasy.league.v1";

function read(): LeagueState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Deep-merge so newly-added fields (e.g. SUPERFLEX) get their defaults.
    return {
      ...DEFAULT_LEAGUE,
      ...raw,
      scoring: { ...DEFAULT_LEAGUE.scoring, ...(raw.scoring || {}) },
      roster: { ...DEFAULT_LEAGUE.roster, ...(raw.roster || {}) },
      connection: { ...DEFAULT_LEAGUE.connection, ...(raw.connection || {}) },
    };
  } catch {
    return { ...DEFAULT_LEAGUE };
  }
}

let state: LeagueState = read();
const listeners = new Set<() => void>();

function commit(next: LeagueState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full/disabled — keep in-memory */
  }
  listeners.forEach((l) => l());
}

export function useLeague(): LeagueState {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

// Non-reactive read for logic/heuristics (draft brain, lineup helpers).
export const getLeague = () => state;

export function setTeams(teams: number) {
  commit({ ...state, teams: Math.max(2, Math.min(20, Math.round(teams))) });
}

export function setScoringPreset(preset: ScoringPreset) {
  if (preset === "custom") {
    commit({ ...state, scoring: { ...state.scoring, preset } });
    return;
  }
  commit({ ...state, scoring: { ...BASE_SCORING, preset, rec: RECEPTION_POINTS[preset] } });
}

export function setScoringStat(stat: keyof Omit<ScoringSettings, "preset">, value: number) {
  // Editing any stat flips the preset to "custom" so it isn't overwritten.
  commit({ ...state, scoring: { ...state.scoring, [stat]: value, preset: "custom" } });
}

export function setRosterSlot(slot: keyof RosterSettings, value: number) {
  commit({ ...state, roster: { ...state.roster, [slot]: Math.max(0, Math.min(12, Math.round(value))) } });
}

export function setConnection(patch: Partial<Connection>) {
  commit({ ...state, connection: { ...state.connection, ...patch } });
}

export function setCurrentWeek(week: number) {
  commit({ ...state, currentWeek: Math.max(1, Math.min(18, Math.round(week))) });
}

export function resetLeague() {
  commit({ ...DEFAULT_LEAGUE });
}

// Total starting slots (used for roster-size math + lineup slot generation).
export function starterCount(r: RosterSettings = state.roster): number {
  return r.QB + r.RB + r.WR + r.TE + r.FLEX + r.SUPERFLEX + r.K + r.DST;
}
