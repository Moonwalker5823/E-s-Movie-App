// Shared Yahoo OAuth 2.0 + Fantasy Sports helpers for the /api/yahoo/* functions.
// The leading underscore keeps Vercel from deploying this file as its own endpoint
// (same convention as api/_fantasyPrompts.ts).
//
// AUTH MODEL — this is a single-user app (Eric's TV) with no database, so there are no
// per-user sessions. One manual sign-in at /api/yahoo/login yields a long-lived refresh
// token that lives in the YAHOO_REFRESH_TOKEN env var; each warm instance mints a
// short-lived access token from it and caches that in module memory.
//
// Env: YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET (from the app registered at
// developer.yahoo.com), YAHOO_REFRESH_TOKEN (printed by the callback after sign-in),
// YAHOO_REDIRECT_URI (optional override), YAHOO_LEAGUE_KEY (optional default league).

export const AUTH_BASE = "https://api.login.yahoo.com/oauth2";
export const FANTASY_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

const TIMEOUT = 10000;

/** Typed failure so handlers can map a cause to a status + a code the client switches on. */
export class YahooError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function creds() {
  const clientId = (process.env.YAHOO_CLIENT_ID || "").trim();
  const clientSecret = (process.env.YAHOO_CLIENT_SECRET || "").trim();
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/** The OAuth redirect URI. Yahoo compares this byte-for-byte against the one registered
 *  on the app AND across the two token calls, so pin it with YAHOO_REDIRECT_URI whenever
 *  the deployment host can vary (preview deploys, custom domains). */
export function redirectUri(req: any): string {
  const fixed = (process.env.YAHOO_REDIRECT_URI || "").trim();
  if (fixed) return fixed;
  const host = (req?.headers?.["x-forwarded-host"] || req?.headers?.host || "").toString();
  if (!host) return "";
  const proto = (req?.headers?.["x-forwarded-proto"] || "https").toString().split(",")[0].trim();
  return `${proto}://${host}/api/yahoo/callback`;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/** POST /oauth2/get_token — used for both the initial code exchange and refreshes.
 *  Yahoo requires redirect_uri on BOTH (unusual: most providers only want it on the
 *  authorization_code grant), so it's added here rather than by each caller. */
export async function requestTokens(params: Record<string, string>, req: any): Promise<Tokens> {
  const { clientId, clientSecret, configured } = creds();
  if (!configured) {
    throw new YahooError(501, "not_configured", "YAHOO_CLIENT_ID / YAHOO_CLIENT_SECRET are not set.");
  }
  const uri = redirectUri(req);
  if (!uri) throw new YahooError(500, "no_redirect_uri", "Could not determine the redirect URI.");

  let r: Response;
  try {
    r = await fetch(`${AUTH_BASE}/get_token`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        // Client creds may go in the body or in Basic auth; Basic keeps the secret out
        // of the form payload (and out of any upstream body logging).
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ ...params, redirect_uri: uri }).toString(),
      signal: AbortSignal.timeout(TIMEOUT),
    });
  } catch {
    throw new YahooError(504, "yahoo_unreachable", "Yahoo's login service did not respond.");
  }

  const text = await r.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* Yahoo answers some failures with HTML — fall through to the error below */
  }
  if (!r.ok || !data?.access_token) {
    const detail = data?.error_description || data?.error || text.slice(0, 200) || `HTTP ${r.status}`;
    // 400/401 here means bad creds, a stale code, or a redirect-URI mismatch — all things
    // the operator has to fix, so surface them as "reconnect" rather than a server fault.
    throw new YahooError(r.status === 400 || r.status === 401 ? 401 : 502, "token_exchange_failed", detail);
  }
  return data as Tokens;
}

interface CachedTokens {
  access: string;
  refresh: string;
  expiresAt: number;
}

// Survives across warm invocations of the same instance; cold starts fall back to the
// refresh token in the env var.
const store: { tok: CachedTokens | null } = ((globalThis as any).__yahooTokens ||= { tok: null });

export function rememberTokens(t: Tokens) {
  store.tok = {
    access: t.access_token,
    // Yahoo normally returns the same refresh token on refresh, but keep the old one if
    // a response ever omits it — losing it would force a manual re-auth.
    refresh: t.refresh_token || store.tok?.refresh || "",
    expiresAt: Date.now() + (Number(t.expires_in) || 3600) * 1000,
  };
}

export function storedRefreshToken(): string {
  return store.tok?.refresh || (process.env.YAHOO_REFRESH_TOKEN || "").trim();
}

/** True once a one-time sign-in has happened (token in memory or in the env var). Note
 *  this only says a token EXISTS — the first refresh is what proves it still works. */
export function isConnected(): boolean {
  return Boolean(storedRefreshToken());
}

/** Where the refresh token came from and how long it is — never the value itself. Enough
 *  to tell a real token from a placeholder or a truncated paste without reading a secret
 *  out of the env var by hand. */
export function tokenInfo(): { source: "memory" | "env" | "none"; length: number } {
  if (store.tok?.refresh) return { source: "memory", length: store.tok.refresh.length };
  const env = (process.env.YAHOO_REFRESH_TOKEN || "").trim();
  return env ? { source: "env", length: env.length } : { source: "none", length: 0 };
}

async function accessToken(req: any): Promise<string> {
  const tok = store.tok;
  // 60s of slack so a token can't expire between this check and the upstream call.
  if (tok?.access && tok.expiresAt - 60_000 > Date.now()) return tok.access;

  const refresh = storedRefreshToken();
  if (!refresh) {
    throw new YahooError(401, "not_connected", "Not signed in to Yahoo — visit /api/yahoo/login once.");
  }
  const t = await requestTokens({ grant_type: "refresh_token", refresh_token: refresh }, req);
  rememberTokens({ ...t, refresh_token: t.refresh_token || refresh });
  return t.access_token;
}

/** GET a Fantasy v2 resource. `path` is a server-built path (never raw user input) —
 *  see the op allowlist in fantasy.ts. */
export async function yahooGet(path: string, req: any): Promise<any> {
  const url = `${FANTASY_BASE}${path}${path.includes("?") ? "&" : "?"}format=json`;

  const call = async (token: string) => {
    try {
      return await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT),
      });
    } catch {
      throw new YahooError(504, "yahoo_unreachable", "Yahoo's fantasy API did not respond.");
    }
  };

  let r = await call(await accessToken(req));
  if (r.status === 401) {
    // The cached access token outlived Yahoo's copy (or was revoked) — drop it and let
    // accessToken() mint a fresh one, then retry exactly once.
    if (store.tok) store.tok = { ...store.tok, access: "", expiresAt: 0 };
    r = await call(await accessToken(req));
  }
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    if (r.status === 401) throw new YahooError(401, "not_connected", "Yahoo rejected the token — sign in again.");
    throw new YahooError(502, "yahoo_error", body.slice(0, 200) || `HTTP ${r.status}`);
  }
  return r.json();
}

// ---------------------------------------------------------------------------
// Yahoo JSON shape helpers.
//
// The Fantasy API's JSON is a transliteration of its XML: every list is an object keyed
// "0","1",… alongside a `count`, and every entity is an ARRAY of partial objects (often
// with one more array nested inside). These three helpers turn that into plain data.
// ---------------------------------------------------------------------------

/** The items of a Yahoo list container ({"0":…,"1":…,"count":2}) in order. */
export function listOf(container: any): any[] {
  if (!container || typeof container !== "object") return [];
  const n = Number(container.count);
  const keys = Number.isFinite(n)
    ? Array.from({ length: n }, (_, i) => String(i))
    : Object.keys(container).filter((k) => /^\d+$/.test(k));
  return keys.map((k) => container[k]).filter((v) => v !== undefined);
}

/** Flatten an entity's array-of-fragments (and nested arrays) into one plain object.
 *  First value wins, which matches Yahoo's ordering — metadata fragments come first. */
export function merge(node: any): Record<string, any> {
  const out: Record<string, any> = {};
  const walk = (v: any) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v)) if (out[k] === undefined) out[k] = val;
    }
  };
  walk(node);
  return out;
}

/** Depth-first hunt for the first container under `key`. Yahoo nests the same payload at
 *  different depths per endpoint, so searching beats hard-coding paths like
 *  fantasy_content.league[1].standings[0].teams. */
export function findKey(node: any, key: string): any {
  if (!node || typeof node !== "object") return undefined;
  if (!Array.isArray(node) && node[key] !== undefined) return node[key];
  for (const v of Array.isArray(node) ? node : Object.values(node)) {
    const hit = findKey(v, key);
    if (hit !== undefined) return hit;
  }
  return undefined;
}
