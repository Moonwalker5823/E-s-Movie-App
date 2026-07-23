import { available, bestAvailable, myRoster, needs } from "../lib/fantasy/draft";
import type { AssistantPick } from "../lib/fantasy/types";

// Asks the serverless Claude assistant for a pick. Falls back to the offline
// draft brain if the AI endpoint isn't configured/available (e.g. local dev
// with no ANTHROPIC_API_KEY, or a network hiccup) so the tool always works.
export async function askAssistant(question?: string): Promise<AssistantPick> {
  const roster = myRoster().map((p) => `${p.name} (${p.pos})`);
  const pool = available()
    .slice(0, 40)
    .map((p) => `${p.name} ${p.pos}-${p.team}`);
  const { starterNeed, flexNeed } = needs();

  try {
    const res = await fetch("/api/draft-assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        roster,
        available: pool,
        needs: { ...starterNeed, FLEX: flexNeed },
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as AssistantPick;
    if (!data.recommendation) throw new Error("empty");
    return data;
  } catch {
    // Graceful fallback — offline value-based recommendation.
    const pick = bestAvailable();
    if (question) {
      pick.reason = `AI is offline (add ANTHROPIC_API_KEY to enable live advice). ${pick.reason}`;
    }
    return pick;
  }
}
