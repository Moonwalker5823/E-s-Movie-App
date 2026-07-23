import { available, bestAvailable, myRoster, needs } from "../lib/fantasy/draft";
import { getSettings } from "../lib/settings";
import type { AssistantPick } from "../lib/fantasy/types";

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
