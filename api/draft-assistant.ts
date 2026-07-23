// Vercel serverless function — the AI draft assistant.
// Runs server-side so the Anthropic API key is never exposed to the browser.
//
// Cost protection (the AI is the only thing that spends money):
//  1. APP_ACCESS_CODES  — comma-separated allowed codes. If set, callers must
//     send a matching code (header "x-access-code" or body.code) or get 403.
//     Give your cousin a code to test; remove it + redeploy to block just him.
//     (If unset, the endpoint is open — fine for local dev.)
//  2. Per-IP rate limit  — soft cap on requests to stop runaway clicking.
//  3. Also set a hard spend limit in the Anthropic Console (Billing → Limits)
//     as the absolute backstop, independent of this app.
//
// Env: ANTHROPIC_API_KEY (required for AI), APP_ACCESS_CODES (optional).

const MODEL = "claude-sonnet-5";
const RATE_MAX = 20; // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP

function rateLimited(ip: string): boolean {
  const store: Record<string, number[]> = ((globalThis as any).__aiHits ||= {});
  const now = Date.now();
  const recent = (store[ip] || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  store[ip] = recent;
  return recent.length > RATE_MAX;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  // 1. Access code gate (per-person, revocable).
  const codes = (process.env.APP_ACCESS_CODES || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (codes.length > 0) {
    const provided = (req.headers["x-access-code"] || body.code || "").toString().trim();
    if (!codes.includes(provided)) {
      res.status(403).json({ error: "blocked" });
      return;
    }
  }

  // 2. Per-IP rate limit.
  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(501).json({ error: "AI not configured" });
    return;
  }

  const { question, roster = [], available = [], needs = {} } = body;

  const system = [
    "You are an elite fantasy football draft assistant helping during a LIVE draft.",
    "Use your current knowledge of the NFL for real, up-to-date advice.",
    "Be decisive and concise. Consider value (ADP), positional need, bye weeks, and upside.",
    'Reply ONLY with minified JSON: {"recommendation":string,"reason":string,"alternates":string[]}.',
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
