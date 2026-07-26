import { PLAYERS } from "../../data/players";

// Team → bye week. Sleeper's player objects don't carry a bye, so we derive the table
// from the seed board (src/data/players.ts), which the app owner refreshes each season.
// Teams not represented in the seed report 0 (unknown) — a safe default (no false bye
// conflicts). Refresh players.ts each year and this stays in sync automatically.
export const BYE_WEEKS: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const p of PLAYERS) if (p.team && p.bye) m[p.team] = p.bye;
  return m;
})();

export const byeFor = (team: string): number => BYE_WEEKS[team] || 0;
