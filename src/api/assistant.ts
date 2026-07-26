import { available, bestAvailable, myRoster, needs } from "../lib/fantasy/draft";
import { getSettings } from "../lib/settings";
import { getLeague } from "../lib/fantasy/league";
import { teamRoster } from "../lib/fantasy/team";
import { slotsFor } from "../lib/fantasy/lineup";
import { getBoard } from "../lib/fantasy/board";
import { sleeperProvider } from "../lib/fantasy/providers/sleeper";
import type { TrendingPlayer } from "../lib/fantasy/providers/types";
import {
  offlineStartSit,
  offlineWaivers,
  offlineTrades,
  offlineWeeklyPlan,
} from "../lib/fantasy/heuristics";
import type {
  AssistantPick,
  Player,
  StartSitResult,
  WaiverResult,
  TradeResult,
  WeeklyPlanResult,
} from "../lib/fantasy/types";

// Asks the serverless Claude assistant for a pick. Falls back to the offline
// draft brain if the AI endpoint isn't configured/available (local dev, no key,
// network hiccup) or if this device is blocked/rate-limited — so the tool
// always works, just without live AI.
export async function askAssistant(question?: string): Promise<AssistantPick> {
  const roster = myRoster().map((p) => `${p.name} (${p.pos})`);
  const pool = available()
    .slice(0, 40)
    .map((p) => `${p.name} ${p.pos}-${p.team}`);
  const { starterNeed, flexNeed } = needs();
  const code = getSettings().accessCode || "";

  let note = "";
  try {
    const res = await fetch("/api/draft-assistant", {
      method: "POST",
      headers: { "content-type": "application/json", "x-access-code": code },
      body: JSON.stringify({
        question,
        code,
        roster,
        available: pool,
        needs: { ...starterNeed, FLEX: flexNeed },
      }),
    });
    if (res.status === 403) note = "🔒 AI is locked for this device — add your access code in Settings.";
    else if (res.status === 429) note = "⏳ Too many AI requests — try again in a few minutes.";
    else if (!res.ok) throw new Error(String(res.status));
    else {
      const data = (await res.json()) as AssistantPick;
      if (!data.recommendation) throw new Error("empty");
      return data;
    }
  } catch {
    /* fall through to offline */
  }

  // Graceful fallback — offline value-based recommendation.
  const pick = bestAvailable();
  pick.reason = `${note || "AI offline — using the built-in draft brain."} ${pick.reason}`.trim();
  return pick;
}

// ─── Weekly assistant (start/sit, waivers, trades, weekly plan) ─────────────────────
// Each posts to the multi-mode /api/fantasy-assistant endpoint and falls back to a
// matching offline heuristic on lock / rate-limit / no-key / network error.

async function callFantasy(mode: string, payload: Record<string, unknown>): Promise<{ note: string; data: any }> {
  const code = getSettings().accessCode || "";
  const res = await fetch("/api/fantasy-assistant", {
    method: "POST",
    headers: { "content-type": "application/json", "x-access-code": code },
    body: JSON.stringify({ mode, code, ...payload }),
  });
  if (res.status === 403) return { note: "🔒 AI is locked — add your access code in Settings.", data: null };
  if (res.status === 429) return { note: "⏳ Too many AI requests — try again shortly.", data: null };
  if (!res.ok) throw new Error(String(res.status));
  return { note: "", data: await res.json() };
}

function teamNeedsObj(roster: Player[]): Record<string, number> {
  const s = getLeague().roster;
  const c = (pos: string) => roster.filter((p) => p.pos === pos).length;
  return {
    QB: Math.max(0, s.QB - c("QB")),
    RB: Math.max(0, s.RB - c("RB")),
    WR: Math.max(0, s.WR - c("WR")),
    TE: Math.max(0, s.TE - c("TE")),
    K: Math.max(0, s.K - c("K")),
    DST: Math.max(0, s.DST - c("DST")),
  };
}

async function getTrending(): Promise<{ raw: TrendingPlayer[]; names: string[] }> {
  try {
    const raw = await sleeperProvider.fetchTrending!("add", 25);
    const byId = new Map(getBoard().map((p) => [p.id, p]));
    const names = raw.map((t) => byId.get(`slp-${t.sleeperId}`)?.name).filter((n): n is string => Boolean(n));
    return { raw, names };
  } catch {
    return { raw: [], names: [] };
  }
}

const rosterNames = (roster: Player[]) => roster.map((p) => `${p.name} (${p.pos}-${p.team})`);

export async function askStartSit(): Promise<StartSitResult> {
  const roster = teamRoster();
  const week = getLeague().currentWeek;
  try {
    const { note, data } = await callFantasy("start_sit", {
      week,
      scoring: getLeague().scoring.preset,
      roster: rosterNames(roster),
      slots: slotsFor().map((s) => s.id),
    });
    if (data && Array.isArray(data.starters)) return { ...data, source: "claude" };
    const off = offlineStartSit(roster, week);
    if (note) off.reason = `${note} ${off.reason}`;
    return off;
  } catch {
    return offlineStartSit(roster, week);
  }
}

export async function askWaivers(): Promise<WaiverResult> {
  const roster = teamRoster();
  const week = getLeague().currentWeek;
  const { raw, names } = await getTrending();
  try {
    const { note, data } = await callFantasy("waivers", {
      week,
      scoring: getLeague().scoring.preset,
      roster: rosterNames(roster),
      needs: teamNeedsObj(roster),
      trending: names,
    });
    if (data && Array.isArray(data.adds)) return { ...data, source: "claude" };
    const off = offlineWaivers(roster, raw, getBoard());
    if (note) off.reason = `${note}${off.reason ? " " + off.reason : ""}`;
    return off;
  } catch {
    return offlineWaivers(roster, raw, getBoard());
  }
}

export async function askTrade(): Promise<TradeResult> {
  const roster = teamRoster();
  try {
    const { note, data } = await callFantasy("trade", {
      scoring: getLeague().scoring.preset,
      roster: rosterNames(roster),
      needs: teamNeedsObj(roster),
    });
    if (data && Array.isArray(data.ideas)) return { ...data, source: "claude" };
    const off = offlineTrades(roster);
    if (note && off.ideas.length) off.ideas[0] = { ...off.ideas[0], reason: `${note} ${off.ideas[0].reason}` };
    return off;
  } catch {
    return offlineTrades(roster);
  }
}

export async function askWeeklyPlan(): Promise<WeeklyPlanResult> {
  const roster = teamRoster();
  const week = getLeague().currentWeek;
  const { names } = await getTrending();
  try {
    const { note, data } = await callFantasy("weekly_plan", {
      week,
      scoring: getLeague().scoring.preset,
      roster: rosterNames(roster),
      needs: teamNeedsObj(roster),
      trending: names,
    });
    if (data && typeof data.summary === "string") return { ...data, source: "claude" };
    const off = offlineWeeklyPlan(roster, week);
    if (note) off.summary = `${note} ${off.summary}`;
    return off;
  } catch {
    return offlineWeeklyPlan(roster, week);
  }
}
