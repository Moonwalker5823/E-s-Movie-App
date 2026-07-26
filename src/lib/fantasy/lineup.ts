import type { Player, Pos, RosterSettings } from "./types";
import { getLeague } from "./league";

export interface Slot {
  id: string;
  label: string;
  eligible: Pos[];
}

const FLEX_POS: Pos[] = ["RB", "WR", "TE"];
const SUPERFLEX_POS: Pos[] = ["QB", "RB", "WR", "TE"];

/** The starting slots for the league (QB1, RB1, RB2, WR…, FLEX, SUPERFLEX?, K, DST). */
export function slotsFor(roster: RosterSettings = getLeague().roster): Slot[] {
  const slots: Slot[] = [];
  const add = (n: number, tag: string, eligible: Pos[]) => {
    for (let i = 1; i <= n; i++) slots.push({ id: `${tag}${i}`, label: n > 1 ? `${tag}${i}` : tag, eligible });
  };
  add(roster.QB, "QB", ["QB"]);
  add(roster.RB, "RB", ["RB"]);
  add(roster.WR, "WR", ["WR"]);
  add(roster.TE, "TE", ["TE"]);
  add(roster.FLEX, "FLEX", FLEX_POS);
  add(roster.SUPERFLEX, "SFLX", SUPERFLEX_POS);
  add(roster.K, "K", ["K"]);
  add(roster.DST, "DST", ["DST"]);
  return slots;
}

export function eligible(slot: Slot, p: Player): boolean {
  return slot.eligible.includes(p.pos);
}

const value = (p: Player) => p.projPts ?? 1000 - p.adp; // projected pts if we have them, else rank value

/** Greedy best-lineup: fill each slot with the highest-value eligible player not already
 *  used, preferring players NOT on bye this week (falls back to a bye player only if
 *  there's no alternative). Returns slotId -> playerId (or null when unfilled). */
export function autoFill(roster: Player[], week: number): Record<string, string | null> {
  const slots = slotsFor();
  const sorted = [...roster].sort((a, b) => value(b) - value(a));
  const used = new Set<string>();
  const out: Record<string, string | null> = {};
  for (const slot of slots) {
    let pick = sorted.find((p) => !used.has(p.id) && eligible(slot, p) && p.bye !== week);
    if (!pick) pick = sorted.find((p) => !used.has(p.id) && eligible(slot, p));
    out[slot.id] = pick ? pick.id : null;
    if (pick) used.add(pick.id);
  }
  return out;
}

export function byeConflicts(roster: Player[], week: number): Player[] {
  return week > 0 ? roster.filter((p) => p.bye === week) : [];
}

export function startersFromLineup(lineup: Record<string, string | null>): string[] {
  return Object.values(lineup).filter((x): x is string => Boolean(x));
}
