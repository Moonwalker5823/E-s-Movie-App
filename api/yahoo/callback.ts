// Step 2 of the one-time Yahoo sign-in: exchange the authorization code for tokens and
// show the refresh token so it can be saved as the YAHOO_REFRESH_TOKEN env var.
//
// The app has no database, and it only ever serves one person, so the refresh token IS
// the persistence layer: paste it into Vercel once and every later request mints its own
// short-lived access token from it. The token is also cached in memory here, so fantasy
// data works immediately — until this instance goes cold.
import { requestTokens, rememberTokens, YahooError } from "./_yahoo.js";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(title: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: dark }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
         background:#0b0b12; color:#f4efe6;
         font:16px/1.55 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif }
  .card { width:min(680px,100%); background:#14141f; border:1px solid #2a2a3a;
          border-radius:18px; padding:28px }
  h1 { margin:0 0 4px; font-size:24px }
  p { color:#c9c2b6 }
  ol { color:#c9c2b6; padding-left:20px } li { margin:6px 0 }
  code, .tok { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px }
  .tok { display:block; word-break:break-all; background:#0b0b12; border:1px solid #2a2a3a;
         border-radius:12px; padding:14px; margin:10px 0; color:#9ee520 }
  button { background:#9ee520; color:#0b0b12; border:0; border-radius:999px;
           padding:10px 20px; font-weight:700; font-size:15px; cursor:pointer }
  .warn { background:#2a1a0a; border:1px solid #6b4a12; border-radius:12px;
          padding:12px 14px; color:#ffd400; font-size:14px }
  .err { color:#ff5c47 }
</style></head><body><div class="card">${bodyHtml}</div></body></html>`;
}

export default async function handler(req: any, res: any) {
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-robots-tag", "noindex");
  res.setHeader("content-type", "text/html; charset=utf-8");

  const q = req.query || {};
  const fail = (status: number, heading: string, detail: string) =>
    res.status(status).send(page("Yahoo sign-in failed", `<h1 class="err">${esc(heading)}</h1><p>${esc(detail)}</p>`));

  // Yahoo reports a declined consent (or a bad app config) on the redirect itself.
  if (q.error) {
    fail(400, "Yahoo declined the request", `${q.error}: ${q.error_description || "no detail provided"}`);
    return;
  }

  const code = (q.code || "").toString();
  if (!code) {
    fail(400, "Missing authorization code", "Start over at /api/yahoo/login.");
    return;
  }

  // CSRF check. The cookie is absent if the flow didn't start at /api/yahoo/login (or if
  // it was started over 10 minutes ago), so only enforce a match when one is present.
  const cookieState = /(?:^|;\s*)yh_state=([^;]+)/.exec((req.headers?.cookie || "").toString())?.[1];
  if (cookieState && (q.state || "").toString() !== cookieState) {
    fail(400, "State mismatch", "The sign-in didn't start here. Try again from /api/yahoo/login.");
    return;
  }
  res.setHeader("set-cookie", "yh_state=; Path=/api/yahoo; Max-Age=0; HttpOnly; SameSite=Lax");

  try {
    const tokens = await requestTokens({ grant_type: "authorization_code", code }, req);
    rememberTokens(tokens);

    // Yahoo can complete the exchange and still hand back no refresh token — that's what
    // a grant with no Fantasy Sports permission looks like. Say so, rather than printing
    // a placeholder that gets pasted into Vercel and rejected an hour later.
    if (!tokens.refresh_token) {
      fail(
        502,
        "No refresh token returned",
        "Yahoo approved the sign-in but issued no refresh token. That usually means the app " +
          "registration is missing the Fantasy Sports permission — open developer.yahoo.com/apps, " +
          "edit this app, tick API Permissions → Fantasy Sports → Read, save, and sign in again."
      );
      return;
    }

    res.status(200).send(
      page(
        "Yahoo connected",
        `<h1>✅ Yahoo connected</h1>
         <p>Fantasy data works right now. To keep it working after this server instance
            goes cold, save the refresh token below — it doesn't expire.</p>
         <span class="tok" id="tok">${esc(tokens.refresh_token)}</span>
         <p><button onclick="navigator.clipboard.writeText(document.getElementById('tok').textContent.trim()).then(()=>{this.textContent='Copied ✓'})">Copy token</button></p>
         <ol>
           <li>Vercel → project <b>erics-movies</b> → Settings → Environment Variables</li>
           <li>Add <code>YAHOO_REFRESH_TOKEN</code> = the value above (all environments)</li>
           <li>Redeploy, then open Fantasy on the TV</li>
         </ol>
         <p class="warn">Treat this like a password — it grants read access to your Yahoo
            fantasy account. Don't paste it into chat, a commit, or a screenshot.</p>`
      )
    );
  } catch (e: any) {
    const err = e instanceof YahooError ? e : new YahooError(500, "unknown", e?.message || "Unexpected error");
    fail(
      err.status,
      "Token exchange failed",
      `${err.code}: ${err.message}` +
        (err.code === "token_exchange_failed"
          ? " — usually the redirect URI registered on the Yahoo app doesn't exactly match this one."
          : "")
    );
  }
}
