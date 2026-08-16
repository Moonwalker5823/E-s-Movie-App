// Vercel serverless function — the app's only door to Yahoo Fantasy data.
//
// Deliberately NOT a generic proxy: the client picks an `op` from a fixed list and the
// path is built here from validated pieces. A free-form `path` param would hand anyone
// on the internet Eric's Yahoo token pointed at a URL of their choosing.
//
// Yahoo's JSON is also gnarly (lists keyed "0","1",…, entities split across array
// fragments), so every op returns a flat, boring shape the UI can render directly.
//
// Env: YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, YAHOO_REFRESH_TOKEN (see _yahoo.ts),
// YAHOO_LEAGUE_KEY (optional — the league used when the client doesn't name one).
import { YahooError, creds, findKey, isConnected, listOf, merge, yahooGet } from "./_yahoo";

// Jones Family League. Yahoo mints a NEW league id every season, so this is only a
// fallback — the client discovers the live key with `op=mine` and passes it back.
const FALLBACK_LEAGUE_KEY = "nfl.l.1261152";

const LEAGUE_KEY_RE = /^[a-z0-9]+\.l\.\d+$/i; // e.g. nfl.l.1261152 or 461.l.1261152
const TEAM_KEY_RE = /^[a-z0-9]+\.l\.\d+\.t\.\d+$/i; // e.g. 461.l.1261152.t.5

const RATE_MAX = 120; // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP

function rateLimited(ip: string): boolean {
  const store: Record<string, number[]> = ((globalThis as any).__yahooHits ||= {});
  const now = Date.now();
  const recent = (store[ip] || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  store[ip] = recent;
  return recent.length > RATE_MAX;
}

// Short TTL cache so a TV left on the Fantasy page doesn't burn the Yahoo quota. Live
// scores move fast; standings and settings don't.
const TTL: Record<string, number> = {
  mine: 60 * 60 * 1000,
  league: 30 * 60 * 1000,
  standings: 5 * 60 * 1000,
  scoreboard: 60 * 1000,
  roster: 60 * 1000,
};
const cache: Record<string, { at: number; body: any }> = ((globalThis as any).__yahooCache ||= {});

// --- normalizers ------------------------------------------------------------

function teamLogo(t: Record<string, any>): string {
  const url = merge(t.team_logos)?.team_logo?.url || "";
  return typeof url === "string" && url.startsWith("https://") ? url : "";
}

function normTeam(raw: any) {
  const t = merge(raw);
  const standings = merge(t.team_standings);
  const outcome = merge(standings.outcome_totals);
  const streak = merge(standings.streak);
  const manager = merge(t.managers)?.manager;
  return {
    teamKey: String(t.team_key || ""),
    teamId: Number(t.team_id) || 0,
    name: String(t.name || "Team"),
    manager: String((Array.isArray(manager) ? merge(manager) : manager)?.nickname || ""),
    logo: teamLogo(t),
    // `is_owned_by_current_login` is how we find Eric's team without hardcoding an id.
    isMine: String(t.is_owned_by_current_login || "") === "1",
    rank: Number(standings.rank) || 0,
    wins: Number(outcome.wins) || 0,
    losses: Number(outcome.losses) || 0,
    ties: Number(outcome.ties) || 0,
    streak: streak.type ? `${streak.type === "win" ? "W" : "L"}${streak.value}` : "",
    pointsFor: Number(standings.points_for) || 0,
    pointsAgainst: Number(standings.points_against) || 0,
    // Present on scoreboard/roster responses (this week's live score), absent on standings.
    points: Number(merge(t.team_points).total) || 0,
    projected: Number(merge(t.team_projected_points).total) || 0,
    movesLeft: Number(t.roster_adds?.value) >= 0 ? Number(t.roster_adds.value) : null,
  };
}

function normPlayer(raw: any) {
  const p = merge(raw);
  const name = merge(p.name);
  return {
    playerKey: String(p.player_key || ""),
    playerId: String(p.player_id || ""),
    name: String(name.full || ""),
    pos: String(p.display_position || merge(p.eligible_positions).position || ""),
    team: String(p.editorial_team_abbr || "").toUpperCase(),
    // Yahoo only sets these when something's wrong (Q, O, IR, BYE) — blank means healthy.
    status: String(p.status_full || p.status || ""),
    injuryNote: String(p.injury_note || ""),
    bye: Number(merge(p.bye_weeks).week) || 0,
    // "QB"/"WR"/"BN"/"IR" — where the manager actually has them slotted this week.
    slot: String(merge(p.selected_position).position || ""),
    points: Number(merge(p.player_points).total) || 0,
    headshot: String(merge(p.headshot).url || ""),
  };
}

// --- ops --------------------------------------------------------------------

async function runOp(op: string, q: any, req: any): Promise<any> {
  const leagueKey = (q.leagueKey || process.env.YAHOO_LEAGUE_KEY || FALLBACK_LEAGUE_KEY).toString().trim();
  if (!LEAGUE_KEY_RE.test(leagueKey)) throw new YahooError(400, "bad_league_key", `Invalid league key: ${leagueKey}`);

  const weekRaw = Number(q.week);
  const week = Number.isFinite(weekRaw) ? Math.max(1, Math.min(18, Math.round(weekRaw))) : 0;

  switch (op) {
    // Every NFL team the signed-in Yahoo account manages this season. This is how the
    // client learns the CURRENT league key — the id changes each year on renewal.
    case "mine": {
      const data = await yahooGet(`/users;use_login=1/games;game_keys=nfl/teams`, req);
      const teams = listOf(findKey(data, "teams")).map((t: any) => normTeam(t.team));
      return {
        teams: teams
          .filter((t) => TEAM_KEY_RE.test(t.teamKey))
          .map((t) => ({ ...t, leagueKey: t.teamKey.replace(/\.t\.\d+$/, "") })),
      };
    }

    case "league": {
      const data = await yahooGet(`/league/${leagueKey};out=settings`, req);
      const l = merge(findKey(data, "league"));
      const settings = merge(l.settings);
      // Yahoo's NFL stat catalog: id 11 is Receptions. Used only as a hint to pre-fill
      // the app's scoring preset, so a mismatch degrades to "custom", never to bad math.
      const recMod = listOf(merge(settings.stat_modifiers).stats)
        .map((s: any) => merge(s.stat))
        .find((s: any) => String(s.stat_id) === "11");
      return {
        leagueKey: String(l.league_key || leagueKey),
        name: String(l.name || "League"),
        season: String(l.season || ""),
        teams: Number(l.num_teams) || 0,
        currentWeek: Number(l.current_week) || 0,
        startWeek: Number(l.start_week) || 1,
        endWeek: Number(l.end_week) || 17,
        scoringType: String(l.scoring_type || ""),
        url: String(l.url || ""),
        isFinished: String(l.is_finished || "") === "1",
        receptionPoints: recMod ? Number(recMod.value) || 0 : null,
      };
    }

    case "standings": {
      const data = await yahooGet(`/league/${leagueKey}/standings`, req);
      const teams = listOf(findKey(data, "teams"))
        .map((t: any) => normTeam(t.team))
        .sort((a, b) => (a.rank || 99) - (b.rank || 99));
      return { leagueKey, teams };
    }

    case "scoreboard": {
      const data = await yahooGet(`/league/${leagueKey}/scoreboard${week ? `;week=${week}` : ""}`, req);
      const matchups = listOf(findKey(data, "matchups")).map((m: any) => {
        const mu = merge(m.matchup);
        return {
          week: Number(mu.week) || week,
          // preevent | midevent | postevent — drives "final" vs "live" in the UI.
          status: String(mu.status || ""),
          isPlayoffs: String(mu.is_playoffs || "") === "1",
          winnerTeamKey: String(mu.winner_team_key || ""),
          teams: listOf(findKey(mu, "teams")).map((t: any) => normTeam(t.team)),
        };
      });
      return { leagueKey, week: matchups[0]?.week || week, matchups };
    }

    case "roster": {
      const teamKey = (q.teamKey || "").toString().trim();
      if (!TEAM_KEY_RE.test(teamKey)) throw new YahooError(400, "bad_team_key", `Invalid team key: ${teamKey}`);
      // The stats sub-resource is what attaches each player's points for that week.
      const path = week
        ? `/team/${teamKey}/roster;week=${week}/players/stats;type=week;week=${week}`
        : `/team/${teamKey}/roster/players/stats`;
      const data = await yahooGet(path, req);
      const players = listOf(findKey(data, "players")).map((p: any) => normPlayer(p.player));
      return { teamKey, week, players };
    }

    default:
      throw new YahooError(400, "unknown_op", `Unknown op: ${op}`);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("cache-control", "no-store");

  const q = req.query || {};
  const op = (q.op || "status").toString();

  // Cheap, Yahoo-free readiness probe — the UI asks this before showing any live panel.
  if (op === "status") {
    res.status(200).json({
      configured: creds().configured,
      connected: isConnected(),
      leagueKey: (process.env.YAHOO_LEAGUE_KEY || FALLBACK_LEAGUE_KEY).trim(),
    });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limited", message: "Too many requests — try again shortly." });
    return;
  }

  const key = `${op}:${q.leagueKey || ""}:${q.teamKey || ""}:${q.week || ""}`;
  const ttl = TTL[op] ?? 60 * 1000;
  const hit = cache[key];
  if (hit && Date.now() - hit.at < ttl) {
    res.status(200).json({ ...hit.body, cached: true });
    return;
  }

  try {
    const body = await runOp(op, q, req);
    cache[key] = { at: Date.now(), body }; // only successes are cached
    res.status(200).json(body);
  } catch (e: any) {
    const err = e instanceof YahooError ? e : new YahooError(500, "unknown", e?.message || "Unexpected error");
    res.status(err.status).json({ error: err.code, message: err.message });
  }
}
