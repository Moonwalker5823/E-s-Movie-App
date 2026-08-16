// Client for /api/yahoo/fantasy — live Jones Family League data (standings, matchups,
// rosters). The serverless side holds the OAuth token and hands back flat shapes, so
// there's no Yahoo weirdness (or any credential) in the browser.
//
// Every call can fail for an EXPECTED reason — the Yahoo app isn't configured, nobody has
// signed in yet, or there's no serverless runtime at all under plain `vite dev`. Those
// arrive as a `code` on the thrown error so the UI can say something useful instead of
// "something went wrong".
import { fetchWithTimeout } from "../lib/fetchTimeout";

const ENDPOINT = "/api/yahoo/fantasy";

export type YahooErrorCode =
  | "not_configured" // no client id/secret on the server
  | "not_connected" // never signed in, or the refresh token was revoked
  | "rate_limited"
  | "unavailable" // no serverless runtime (vite dev) or the network dropped
  | "bad_request"
  | "yahoo_error";

export class YahooError extends Error {
  code: YahooErrorCode;
  constructor(code: YahooErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface YahooTeam {
  teamKey: string;
  teamId: number;
  name: string;
  manager: string;
  logo: string;
  isMine: boolean;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  streak: string;
  pointsFor: number;
  pointsAgainst: number;
  points: number; // this week's live score (scoreboard responses only)
  projected: number;
  movesLeft: number | null;
}

export interface YahooMyTeam extends YahooTeam {
  leagueKey: string;
}

export interface YahooPlayer {
  playerKey: string;
  playerId: string;
  name: string;
  pos: string;
  team: string;
  status: string; // "" when healthy — else Questionable / Out / IR / …
  injuryNote: string;
  bye: number;
  slot: string; // QB / RB / W/R/T / BN / IR — where they're started this week
  points: number;
  headshot: string;
}

export interface YahooMatchup {
  week: number;
  status: string; // preevent | midevent | postevent
  isPlayoffs: boolean;
  winnerTeamKey: string;
  teams: YahooTeam[];
}

export interface YahooLeague {
  leagueKey: string;
  name: string;
  season: string;
  teams: number;
  currentWeek: number;
  startWeek: number;
  endWeek: number;
  scoringType: string;
  url: string;
  isFinished: boolean;
  receptionPoints: number | null;
}

export interface YahooStatus {
  configured: boolean;
  connected: boolean;
  leagueKey: string;
}

async function call<T>(op: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const qs = new URLSearchParams({ op });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(`${ENDPOINT}?${qs}`, {}, 12000);
  } catch {
    throw new YahooError("unavailable", "Couldn't reach the server.");
  }

  // Under `vite dev` there's no serverless runtime, so this path 404s with HTML rather
  // than JSON. Treat any non-JSON answer as "the backend isn't there".
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    throw new YahooError("unavailable", "Live Yahoo data needs the deployed app.");
  }

  if (!res.ok) {
    const code: YahooErrorCode =
      body?.error === "not_configured" ||
      body?.error === "not_connected" ||
      body?.error === "rate_limited" ||
      body?.error === "yahoo_error"
        ? body.error
        : res.status === 400
          ? "bad_request"
          : "yahoo_error";
    throw new YahooError(code, body?.message || `Yahoo request failed (${res.status}).`);
  }
  return body as T;
}

/** Is Yahoo set up on the server, and has anyone signed in? Never touches Yahoo itself. */
export function yahooStatus(): Promise<YahooStatus> {
  return call<YahooStatus>("status");
}

/** Every NFL team the signed-in account manages this season — the only reliable way to
 *  learn the CURRENT league key, since Yahoo mints a new league id every year. */
export function yahooMine(): Promise<{ teams: YahooMyTeam[] }> {
  return call<{ teams: YahooMyTeam[] }>("mine");
}

export function yahooLeague(leagueKey?: string): Promise<YahooLeague> {
  return call<YahooLeague>("league", { leagueKey });
}

export function yahooStandings(leagueKey?: string): Promise<{ leagueKey: string; teams: YahooTeam[] }> {
  return call<{ leagueKey: string; teams: YahooTeam[] }>("standings", { leagueKey });
}

export function yahooScoreboard(
  leagueKey?: string,
  week?: number
): Promise<{ leagueKey: string; week: number; matchups: YahooMatchup[] }> {
  return call("scoreboard", { leagueKey, week });
}

export function yahooRoster(
  teamKey: string,
  week?: number
): Promise<{ teamKey: string; week: number; players: YahooPlayer[] }> {
  return call("roster", { teamKey, week });
}
