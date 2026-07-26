import { useSyncExternalStore } from "react";

// Per-week state: your saved lineup (slotId -> playerId) and which routine tasks you've
// checked off. Keyed by week number so each week is independent.

const KEY = "ema.fantasy.week.v1";

interface WeekState {
  lineups: Record<number, Record<string, string | null>>;
  checklist: Record<number, Record<string, boolean>>;
}

function read(): WeekState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    return { lineups: raw.lineups || {}, checklist: raw.checklist || {} };
  } catch {
    return { lineups: {}, checklist: {} };
  }
}

let state: WeekState = read();
const listeners = new Set<() => void>();

function commit(next: WeekState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function useWeek(): WeekState {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

export const getWeek = () => state;

export function lineupFor(week: number): Record<string, string | null> {
  return state.lineups[week] || {};
}

export function setLineup(week: number, lineup: Record<string, string | null>) {
  commit({ ...state, lineups: { ...state.lineups, [week]: lineup } });
}

export function setSlot(week: number, slotId: string, playerId: string | null) {
  const cur = state.lineups[week] || {};
  commit({ ...state, lineups: { ...state.lineups, [week]: { ...cur, [slotId]: playerId } } });
}

export function checklistFor(week: number): Record<string, boolean> {
  return state.checklist[week] || {};
}

export function toggleTask(week: number, taskId: string) {
  const cur = state.checklist[week] || {};
  commit({ ...state, checklist: { ...state.checklist, [week]: { ...cur, [taskId]: !cur[taskId] } } });
}
