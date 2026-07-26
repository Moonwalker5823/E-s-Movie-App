import type { Connection } from "../league";
import type { LeagueProvider } from "./types";
import { sleeperProvider } from "./sleeper";
import { manualProvider } from "./manual";
import { espnProvider } from "./espn";

// The live-data provider for the current connection (defaults to manual). Used for
// LEAGUE sync (rosters/matchups) in the weekly tools. The player board itself always
// refreshes from Sleeper's free global DB — see board.ts — regardless of this choice.
export function providerFor(conn: Connection): LeagueProvider {
  switch (conn.provider) {
    case "sleeper":
      return sleeperProvider;
    case "espn":
      return espnProvider;
    default:
      return manualProvider;
  }
}
