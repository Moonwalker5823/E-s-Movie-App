import { useEffect, useState } from "react";
import { useTeam, teamRoster } from "../../../lib/fantasy/team";
import { useLeague } from "../../../lib/fantasy/league";
import { useBoard } from "../../../lib/fantasy/board";
import { slotsFor, autoFill, startersFromLineup } from "../../../lib/fantasy/lineup";
import { sleeperProvider } from "../../../lib/fantasy/providers/sleeper";
import type { Pos } from "../../../lib/fantasy/types";
import StatTile from "../charts/StatTile";
import Bars from "../charts/Bars";
import Gauge from "../charts/Gauge";
import Sparkline from "../charts/Sparkline";
import TierColumns from "../charts/TierColumns";

const POS_ORDER: Pos[] = ["QB", "RB", "WR", "TE", "K", "DST"];
const POS_HEX: Record<Pos, string> = {
  QB: "#2bd4ff", RB: "#9ee520", WR: "#ff5c47", TE: "#ffd400", K: "#8b3ffb", DST: "#35d07f",
};

// Live head-to-head matchup, pulled from a connected Sleeper league. Renders nothing
// unless Sleeper is connected (league ID + username set in League Settings), so the
// rest of the analytics still works fully offline.
function MatchupPanel() {
  const league = useLeague();
  const conn = league.connection;
  const connected = conn.provider === "sleeper" && Boolean(conn.sleeperLeagueId) && Boolean(conn.sleeperUser);
  const week = league.currentWeek;
  const [status, setStatus] = useState<"loading" | "error" | "empty" | "ok">("loading");
  const [m, setM] = useState<{ me: number; opp: number; oppName: string } | null>(null);

  useEffect(() => {
    if (!connected) return;
    let alive = true;
    setStatus("loading");
    (async () => {
      try {
        const lid = conn.sleeperLeagueId!;
        const [rosters, uid, users, matchups] = await Promise.all([
          sleeperProvider.fetchRosters!(lid),
          sleeperProvider.resolveUser!(conn.sleeperUser!),
          sleeperProvider.fetchUsers!(lid),
          sleeperProvider.fetchMatchups!(lid, week),
        ]);
        if (!alive) return;
        const mine = uid ? rosters.find((r) => r.ownerId === uid) : null;
        const myEntry = mine ? matchups.find((x) => x.rosterId === mine.rosterId) : null;
        if (!mine || !myEntry) {
          setStatus("empty");
          return;
        }
        const oppEntry = matchups.find((x) => x.matchupId === myEntry.matchupId && x.rosterId !== mine.rosterId);
        const oppRoster = oppEntry ? rosters.find((r) => r.rosterId === oppEntry.rosterId) : null;
        const oppName = oppRoster ? users[oppRoster.ownerId] || `Team ${oppEntry!.rosterId}` : "";
        setM({ me: myEntry.points, opp: oppEntry?.points ?? 0, oppName: oppEntry ? oppName : "" });
        setStatus("ok");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, conn.sleeperLeagueId, conn.sleeperUser, week]);

  if (!connected) return null;

  return (
    <div className="card p-4">
      <h3 className="mb-3 font-display text-2xl text-cream">Week {week} Matchup</h3>
      {status === "loading" && <p className="text-sm text-cream/60">Loading your live matchup…</p>}
      {status === "error" && <p className="text-sm text-cream/60">Couldn&apos;t reach Sleeper — try again shortly.</p>}
      {status === "empty" && (
        <p className="text-sm text-cream/60">
          No matchup posted for week {week} yet — or your team wasn&apos;t found (check your username in League Settings).
        </p>
      )}
      {status === "ok" && m && (m.oppName ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="You" value={m.me.toFixed(1)} sub="points" />
            <StatTile label={m.oppName} value={m.opp.toFixed(1)} sub="points" />
          </div>
          <div className="mt-4">
            <Gauge
              value={m.me + m.opp > 0 ? m.me / (m.me + m.opp) : 0.5}
              label={m.me === m.opp ? "Dead even" : m.me > m.opp ? `Leading by ${(m.me - m.opp).toFixed(1)}` : `Trailing by ${(m.opp - m.me).toFixed(1)}`}
            />
          </div>
          <p className="mt-2 text-xs text-cream/60">Your share of points scored so far this week (live from Sleeper).</p>
        </>
      ) : (
        <p className="text-sm text-cream/60">You&apos;re on a bye this week — {m.me.toFixed(1)} points, no opponent.</p>
      ))}
    </div>
  );
}

export default function AnalyticsTab() {
  useTeam();
  useBoard();
  const league = useLeague();
  const roster = teamRoster();

  if (roster.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-display text-2xl text-cream">No roster yet</h3>
        <p className="mt-1 text-sm text-cream/60">
          Load your team in <b>This Week</b> (import from your draft or sync Sleeper) to see your
          roster analytics.
        </p>
      </div>
    );
  }

  const week = league.currentWeek;
  const slots = slotsFor();
  const filled = startersFromLineup(autoFill(roster, week)).length;
  const count = (pos: Pos) => roster.filter((p) => p.pos === pos).length;

  const posBars = POS_ORDER.map((pos) => {
    const c = count(pos);
    const req = league.roster[pos];
    return {
      label: pos,
      value: c,
      max: Math.max(req, c, 1),
      note: `${c}/${req}`,
      color: POS_HEX[pos],
    };
  });

  // Roster depth curve — player values sorted desc shows how top-heavy the team is.
  const depthCurve = roster.map((p) => 1000 - p.adp).sort((a, b) => b - a);

  // Tier buckets (1, 2, 3, 4+).
  const tierMap: Record<number, string[]> = {};
  roster.forEach((p) => {
    const t = Math.min(4, p.tier || 4);
    (tierMap[t] ||= []).push(p.name);
  });
  const tiers = [1, 2, 3, 4].map((t) => ({ tier: t, players: tierMap[t] || [] }));

  const avgRank = Math.round(roster.reduce((s, p) => s + (p.searchRank ?? p.adp), 0) / roster.length);
  const eliteCount = roster.filter((p) => p.tier === 1).length;

  const conn = league.connection;
  const sleeperConnected = conn.provider === "sleeper" && Boolean(conn.sleeperLeagueId) && Boolean(conn.sleeperUser);

  return (
    <div className="space-y-6">
      {/* Live head-to-head, when a Sleeper league is connected (renders null otherwise). */}
      <MatchupPanel />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Roster" value={roster.length} sub="players" />
        <StatTile label="Starters" value={`${filled}/${slots.length}`} sub="fillable" />
        <StatTile label="Avg rank" value={avgRank} sub="lower = better" />
        <StatTile label="Elite (T1)" value={eliteCount} sub="tier-1 players" />
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-2xl text-cream">Position Strength</h3>
        <Bars data={posBars} />
        <p className="mt-2 text-xs text-cream/60">Your count vs. the league's starting requirement per position.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 font-display text-2xl text-cream">Lineup Readiness</h3>
          <Gauge value={slots.length ? filled / slots.length : 0} label={`${filled} of ${slots.length} starting slots fillable`} />
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-display text-2xl text-cream">Roster Depth Curve</h3>
          <Sparkline points={depthCurve} />
          <p className="mt-2 text-xs text-cream/60">Player value, best to worst — a steep drop means a top-heavy roster.</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-2xl text-cream">Roster by Tier</h3>
        <TierColumns tiers={tiers} />
      </div>

      {!sleeperConnected && (
        <p className="text-xs text-cream/60">
          Live in-app scoring &amp; your weekly matchup show here when you connect a <b className="text-cream/80">Sleeper</b> league
          (free, no login) in My Team → League Settings. Yahoo &amp; ESPN don&apos;t offer live scores without a login, so for
          those you open the league site directly (the buttons on the Hub).
        </p>
      )}
    </div>
  );
}
