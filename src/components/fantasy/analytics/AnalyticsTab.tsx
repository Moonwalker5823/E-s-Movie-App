import { useTeam, teamRoster } from "../../../lib/fantasy/team";
import { useLeague } from "../../../lib/fantasy/league";
import { useBoard } from "../../../lib/fantasy/board";
import { slotsFor, autoFill, startersFromLineup } from "../../../lib/fantasy/lineup";
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Roster" value={roster.length} sub="players" />
        <StatTile label="Starters" value={`${filled}/${slots.length}`} sub="fillable" />
        <StatTile label="Avg rank" value={avgRank} sub="lower = better" />
        <StatTile label="Elite (T1)" value={eliteCount} sub="tier-1 players" />
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-2xl text-cream">Position Strength</h3>
        <Bars data={posBars} />
        <p className="mt-2 text-xs text-cream/40">Your count vs. the league's starting requirement per position.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-2 font-display text-2xl text-cream">Lineup Readiness</h3>
          <Gauge value={slots.length ? filled / slots.length : 0} label={`${filled} of ${slots.length} starting slots fillable`} />
        </div>
        <div className="card p-4">
          <h3 className="mb-2 font-display text-2xl text-cream">Roster Depth Curve</h3>
          <Sparkline points={depthCurve} />
          <p className="mt-2 text-xs text-cream/40">Player value, best to worst — a steep drop means a top-heavy roster.</p>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 font-display text-2xl text-cream">Roster by Tier</h3>
        <TierColumns tiers={tiers} />
      </div>

      <p className="text-xs text-cream/40">
        Live weekly scoring &amp; matchup win-probability appear here once you connect a Sleeper league
        (My Team → League Settings).
      </p>
    </div>
  );
}
