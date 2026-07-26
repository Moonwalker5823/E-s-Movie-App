import type { LeagueProvider } from "./types";

// ESPN stub. Private ESPN leagues require `espn_s2` / `SWID` cookies that a browser
// can't send cross-origin, so live sync would need a server proxy (a future
// api/espn-fantasy.ts that injects the cookies). Until then this advertises no
// capabilities and callers fall back to manual entry + a Sleeper board refresh.
export const espnProvider: LeagueProvider = {
  id: "espn",
  caps: { players: false, trending: false, leagueSync: false },
};
