// Step 1 of the one-time Yahoo sign-in: bounce the browser to Yahoo's consent screen.
//
// Open https://<app>/api/yahoo/login in a normal browser (NOT the TV) while signed in as
// the Yahoo account that owns the league. Yahoo sends you back to /api/yahoo/callback,
// which prints the refresh token to save as YAHOO_REFRESH_TOKEN. After that the app
// never needs an interactive login again.
import { AUTH_BASE, creds, redirectUri } from "./_yahoo";

export default async function handler(req: any, res: any) {
  res.setHeader("cache-control", "no-store");

  const { clientId, configured } = creds();
  if (!configured) {
    res.status(501).json({
      error: "not_configured",
      message: "Set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET in the Vercel environment, then redeploy.",
    });
    return;
  }

  const uri = redirectUri(req);
  if (!uri) {
    res.status(500).json({ error: "no_redirect_uri", message: "Could not determine the redirect URI." });
    return;
  }

  // CSRF: Yahoo echoes `state` back to the callback, which checks it against this cookie.
  const state = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  const secure = uri.startsWith("https://") ? "; Secure" : ""; // omitted on http://localhost under `vercel dev`
  res.setHeader("set-cookie", `yh_state=${state}; Path=/api/yahoo; Max-Age=600; HttpOnly; SameSite=Lax${secure}`);

  const url = `${AUTH_BASE}/request_auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    response_type: "code",
    scope: "fspt-r", // Fantasy Sports, read-only
    language: "en-us",
    state,
  })}`;

  res.setHeader("location", url);
  res.status(302).end();
}
