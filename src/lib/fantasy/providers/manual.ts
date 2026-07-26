import type { LeagueProvider } from "./types";

// The always-available fallback: no live sync. Roster comes from the draft or manual
// entry; the player board falls back to the seed (or a Sleeper refresh, which is a free
// global source regardless of which platform your league is on).
export const manualProvider: LeagueProvider = {
  id: "manual",
  caps: { players: false, trending: false, leagueSync: false },
};
