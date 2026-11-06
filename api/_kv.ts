// Tiny Redis client for the serverless functions — last-known-good storage that
// survives cold starts.
//
// WHY THIS EXISTS: the video engine caches feeds in module memory, which dies with the
// instance. So a cold lambda whose upstream fetch gets throttled had nothing to fall
// back on and returned an empty list — the "no items available" the whole app was
// showing. Memory can't fix that; the fallback has to outlive the process.
//
// Deliberately NOT using @vercel/kv or @upstash/redis: this repo has zero backend
// dependencies and Upstash exposes a plain REST API, so `fetch` is the whole client.
// Nothing to install, nothing to keep patched, no lockfile churn.
//
// Env (either naming works — Vercel KV and a direct Upstash integration set different
// ones): KV_REST_API_URL + KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL +
// UPSTASH_REDIS_REST_TOKEN. With neither set, every call below is a no-op and the
// engine behaves exactly as it did before — so deploying this can't break anything
// while the store is still being provisioned.

const BASE = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

/** True once a store is configured. Callers use it to skip pointless work. */
export const kvReady = Boolean(BASE && TOKEN);

// Short timeout on purpose: the store is a nice-to-have on the response path, and a
// slow Redis must never be the reason a page hangs. Failing fast just means the caller
// falls through to whatever it had before.
const TIMEOUT = 2500;

export async function kvGet<T>(key: string): Promise<T | null> {
  if (!kvReady) return null;
  try {
    const r = await fetch(`${BASE}/get/${encodeURIComponent(key)}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!r.ok) return null;
    // Upstash answers { result: "<the stored string>" | null }.
    const body = (await r.json()) as { result?: string | null };
    return body?.result ? (JSON.parse(body.result) as T) : null;
  } catch {
    return null; // unreachable / malformed / timed out — treat as a miss
  }
}

/** Store a JSON value with a TTL (seconds). Best-effort: failures are swallowed. */
export async function kvSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!kvReady) return;
  try {
    await fetch(`${BASE}/set/${encodeURIComponent(key)}?EX=${Math.max(1, Math.round(ttlSeconds))}`, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(value),
      signal: AbortSignal.timeout(TIMEOUT),
    });
  } catch {
    /* best effort — a failed write only costs us a future fallback */
  }
}
