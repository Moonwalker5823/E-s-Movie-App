// Vercel serverless function — the AI draft assistant.
// Runs server-side so the Anthropic API key is never exposed to the browser.
// Set ANTHROPIC_API_KEY in your Vercel project's Environment Variables.
//
// POST body: { question, roster, available, needs }
// Returns:   { recommendation, reason, alternates: string[], source: "claude" }

const MODEL = "claude-sonnet-5";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // No key configured — tell the client to use its offline brain.
    res.status(501).json({ error: "AI not configured" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { question, roster = [], available = [], needs = {} } = body;

  const system = [
    "You are an elite fantasy football draft assistant helping during a LIVE draft.",
    "Use your current knowledge of the NFL for real, up-to-date advice.",
    "Be decisive and concise. Consider value (ADP), positional need, bye weeks, and upside.",
    "Reply ONLY with minified JSON: {\"recommendation\":string,\"reason\":string,\"alternates\":string[]}.",
    "recommendation = one player name. reason = 1-2 sentences. alternates = up to 3 names.",
  ].join(" ");

  const user = [
    question ? `Question: ${question}` : "Who should I draft next?",
    `My roster so far: ${roster.length ? roster.join(", ") : "empty"}.`,
    `My positional needs: ${JSON.stringify(needs)}.`,
    `Top available players (by ADP): ${available.slice(0, 40).join(", ")}.`,
  ].join("\n");

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!r.ok) {
      res.status(502).json({ error: `Anthropic ${r.status}` });
      return;
    }
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    res.status(200).json({
      recommendation: json.recommendation || "—",
      reason: json.reason || "",
      alternates: Array.isArray(json.alternates) ? json.alternates : [],
      source: "claude",
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "assistant failed" });
  }
}
