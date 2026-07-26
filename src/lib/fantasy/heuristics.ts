import type { Player, Pos, StartSitResult, WaiverResult, TradeResult, WeeklyPlanResult } from "./types";
import { getLeague } from "./league";
import { autoFill, byeConflicts, startersFromLineup } from "./lineup";
import { tasksForToday, todayLabel } from "./routine";
import type { TrendingPlayer } from "./providers/types";

// Offline (no-key) versions of every weekly AI action. They mirror the AI's job with
// simple, sound heuristics so the whole toolkit works before the API key is added.

export function offlineStartSit(roster: Player[], week: number): StartSitResult {
  const lineup = autoFill(roster, week);
  const starterIds = new Set(startersFromLineup(lineup));
  const starters = roster.filter((p) => starterIds.has(p.id)).map((p) => p.name);
  const sit = roster.filter((p) => !starterIds.has(p.id)).map((p) => p.name);
  const byes = byeConflicts(roster, week).map((p) => p.name);
  const reason = byes.length
    ? `Auto-set by rank, bye-aware — benched this week's byes: ${byes.join(", ")}.`
    : "Auto-set by rank/projection, filling FLEX with your best remaining flex-eligible player.";
  return { starters, sit, reason, source: "offline" };
}

const DEPTH_TARGET: Partial<Record<Pos, number>> = { QB: 2, RB: 5, WR: 5, TE: 2, K: 1, DST: 1 };

export function offlineWaivers(roster: Player[], trending: TrendingPlayer[], board: Player[]): WaiverResult {
  const count = (pos: Pos) => roster.filter((p) => p.pos === pos).length;
  const need = (pos: Pos) => Math.max(0, (DEPTH_TARGET[pos] || 0) - count(pos));
  const byId = new Map(board.map((p) => [p.id, p]));
  const owned = new Set(roster.map((p) => p.id));

  const adds = trending
    .map((t) => byId.get(`slp-${t.sleeperId}`))
    .filter((p): p is Player => Boolean(p) && !owned.has(p!.id))
    .map((p) => {
      const n = need(p.pos);
      return {
        name: p.name,
        pos: p.pos,
        reason: n > 0 ? `Trending add that fills your ${p.pos} depth.` : `Trending add (${p.pos}) — speculative upside.`,
        priority: (n > 0 ? "high" : "med") as "high" | "med" | "low",
      };
    })
    .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1))
    .slice(0, 8);

  // Droppable = your lowest-value bench beyond the depth targets.
  const surplus = roster
    .filter((p) => count(p.pos) > (DEPTH_TARGET[p.pos] || 0))
    .sort((a, b) => b.adp - a.adp) // worst rank first
    .slice(0, 3)
    .map((p) => p.name);

  return {
    adds,
    drops: surplus,
    reason: trending.length ? undefined : "No live waiver trends — connect Sleeper for real adds.",
    source: "offline",
  };
}

export function offlineTrades(roster: Player[]): TradeResult {
  const s = getLeague().roster;
  const count = (pos: Pos) => roster.filter((p) => p.pos === pos).length;
  const need = (pos: Pos): number => Math.max(0, s[pos] - count(pos));

  // Your deepest position (surplus) and your thinnest starting position (deficit).
  const positions: Pos[] = ["QB", "RB", "WR", "TE"];
  const surplusPos = positions.reduce((a, p) => (count(p) - s[p] > count(a) - s[a] ? p : a), "RB" as Pos);
  const deficitPos = positions.reduce((a, p) => (need(p) > need(a) ? p : a), "WR" as Pos);

  const surplusPlayers = roster.filter((p) => p.pos === surplusPos).sort((a, b) => a.adp - b.adp);
  // Offer your DEEPEST spare at that position (never a stud) — only if you have more than
  // the starting requirement there.
  const starters = getLeague().roster[surplusPos] + (["RB", "WR", "TE"].includes(surplusPos) ? getLeague().roster.FLEX : 0);
  const give = surplusPlayers.length > starters ? surplusPlayers.slice(-1).map((p) => p.name) : [];

  const ideas =
    surplusPos !== deficitPos && give.length
      ? [
          {
            give,
            get: [`a starting ${deficitPos}`],
            reason: `You're deep at ${surplusPos} and thin at ${deficitPos} — package a spare ${surplusPos} for a ${deficitPos} upgrade.`,
          },
        ]
      : [];

  return { ideas, source: "offline" };
}

export function offlineWeeklyPlan(roster: Player[], week: number): WeeklyPlanResult {
  const ss = offlineStartSit(roster, week);
  const byes = byeConflicts(roster, week).map((p) => p.name);
  const tasks = tasksForToday().map((t) => ({ label: t.label, detail: t.detail }));
  const summary = roster.length
    ? `It's ${todayLabel()}. ${tasks.length ? `Due today: ${tasks.map((t) => t.label).join("; ")}.` : "Nothing pressing today."}${
        byes.length ? ` Heads up — on bye this week: ${byes.join(", ")}.` : ""
      } Suggested starters: ${ss.starters.slice(0, 5).join(", ")}${ss.starters.length > 5 ? "…" : ""}.`
    : "Import or connect your roster to get a weekly game plan.";
  return { summary, tasks, source: "offline" };
}
