import { useSyncExternalStore } from "react";
import { getBoard } from "./board";
import { getLeague } from "./league";
import type { AssistantPick, DraftedBy, Player, Pos } from "./types";

const KEY = "ema.draft.v1";

// Roster rules now live in the league store (src/lib/fantasy/league.ts) so they're
// editable and shared with the weekly lineup tools; the draft only tracks picks.
interface DraftState {
  picks: Record<string, DraftedBy>; // playerId -> who drafted
  order: string[]; // playerIds in pick order
  custom: Player[]; // players added on the fly
}

function read(): DraftState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    return { picks: raw.picks || {}, order: raw.order || [], custom: raw.custom || [] };
  } catch {
    return { picks: {}, order: [], custom: [] };
  }
}

let state: DraftState = read();
const listeners = new Set<() => void>();

function commit(next: DraftState) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useDraft() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => state
  );
}

export const allPlayers = (): Player[] => [...getBoard(), ...state.custom];
const byId = (id: string) => allPlayers().find((p) => p.id === id);

export function available(): Player[] {
  return allPlayers()
    .filter((p) => !state.picks[p.id])
    .sort((a, b) => a.adp - b.adp);
}

export function myRoster(): Player[] {
  return state.order.filter((id) => state.picks[id] === "me").map(byId).filter(Boolean) as Player[];
}

export function draftPlayer(playerId: string, by: DraftedBy) {
  if (state.picks[playerId]) return;
  commit({ ...state, picks: { ...state.picks, [playerId]: by }, order: [...state.order, playerId] });
}

export function undoLast() {
  const order = [...state.order];
  const last = order.pop();
  if (!last) return;
  const picks = { ...state.picks };
  delete picks[last];
  commit({ ...state, picks, order });
}

export function resetDraft() {
  commit({ picks: {}, order: [], custom: [] });
}

export function addCustomPlayer(p: Omit<Player, "id">): Player {
  const player: Player = { ...p, id: `custom-${Date.now()}` };
  commit({ ...state, custom: [...state.custom, player] });
  return player;
}

// ---- Positional needs ----
const FLEX: Pos[] = ["RB", "WR", "TE"];
const SUPERFLEX: Pos[] = ["QB", "RB", "WR", "TE"];

export function needs() {
  const roster = myRoster();
  const count = (pos: Pos) => roster.filter((p) => p.pos === pos).length;
  const s = getLeague().roster; // roster rules live in the league store now
  const starterNeed: Record<string, number> = {
    QB: Math.max(0, s.QB - count("QB")),
    RB: Math.max(0, s.RB - count("RB")),
    WR: Math.max(0, s.WR - count("WR")),
    TE: Math.max(0, s.TE - count("TE")),
    K: Math.max(0, s.K - count("K")),
    DST: Math.max(0, s.DST - count("DST")),
  };
  const flexSurplus =
    Math.max(0, count("RB") - s.RB) + Math.max(0, count("WR") - s.WR) + Math.max(0, count("TE") - s.TE);
  const flexNeed = Math.max(0, s.FLEX - flexSurplus);
  // Superflex is fed by leftover QB/flex-eligible surplus (a backup QB is the value play).
  const qbSurplus = Math.max(0, count("QB") - s.QB);
  const leftoverFlex = Math.max(0, flexSurplus - s.FLEX);
  const superflexNeed = Math.max(0, s.SUPERFLEX - qbSurplus - leftoverFlex);
  return { starterNeed, flexNeed, superflexNeed, count };
}

// ---- Offline draft brain: best available by value + need ----
export function bestAvailable(): AssistantPick {
  const pool = available();
  if (pool.length === 0) {
    return { recommendation: "—", reason: "Board is empty.", alternates: [], source: "offline" };
  }
  const { starterNeed, flexNeed, superflexNeed } = needs();

  const score = (p: Player) => {
    let s = 1000 - p.adp; // value: earlier ADP = higher
    if ((starterNeed[p.pos] || 0) > 0) s += 180; // fills a starting slot
    else if (FLEX.includes(p.pos) && flexNeed > 0) s += 80; // fills FLEX
    else if (SUPERFLEX.includes(p.pos) && superflexNeed > 0) s += 120; // fills SUPERFLEX
    if (p.tier === 1) s += 25; // elite tier nudge
    return s;
  };

  const ranked = [...pool].sort((a, b) => score(b) - score(a));
  const top = ranked[0];
  const fillsStarter = (starterNeed[top.pos] || 0) > 0;
  const fillsFlex = FLEX.includes(top.pos) && flexNeed > 0;
  const fillsSuperflex = !fillsFlex && SUPERFLEX.includes(top.pos) && superflexNeed > 0;
  const reason = fillsStarter
    ? `Best value that also fills your ${top.pos} need (ADP ${top.adp}, tier ${top.tier}).`
    : fillsFlex
      ? `Strong value that fills your FLEX (ADP ${top.adp}, tier ${top.tier}).`
      : fillsSuperflex
        ? `Strong value that fills your SUPERFLEX (ADP ${top.adp}, tier ${top.tier}).`
        : `Best player available by value (ADP ${top.adp}, tier ${top.tier}).`;

  return {
    recommendation: top.name,
    reason,
    alternates: ranked.slice(1, 4).map((p) => `${p.name} (${p.pos})`),
    source: "offline",
  };
}

export function rosterSummary() {
  const roster = myRoster();
  const byPos = (pos: Pos) => roster.filter((p) => p.pos === pos);
  return { roster, byPos };
}
