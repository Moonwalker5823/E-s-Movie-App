// Vercel serverless function — the multi-mode fantasy assistant (draft / start-sit /
// waivers / trade / weekly plan). Same cost protection as api/draft-assistant.ts:
// APP_ACCESS_CODES gate + per-IP rate limit + a hard spend limit set in the Anthropic
// Console. Env: ANTHROPIC_API_KEY (required for AI), APP_ACCESS_CODES (optional).
import { buildPrompt, type Mode } from "./_fantasyPrompts";

const MODEL = "claude-sonnet-5";
const RATE_MAX = 30; // requests
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

  // 1. Access-code gate (per-person, revocable).
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

  const mode = (body.mode || "draft") as Mode;
  const built = buildPrompt(mode, body);
  if (!built) {
    res.status(400).json({ error: "unknown mode" });
    return;
  }

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
        max_tokens: built.maxTokens,
        system: built.system,
        messages: [{ role: "user", content: built.user }],
      }),
    });

    if (!r.ok) {
      res.status(502).json({ error: `Anthropic ${r.status}` });
      return;
    }
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    res.status(200).json({ ...json, source: "claude" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "assistant failed" });
  }
}
