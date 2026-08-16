import { connectYahoo, useYahoo } from "../../../lib/fantasy/yahoo";

// What to show when live Yahoo data isn't available. Each reason has exactly one fix, so
// say which one it is rather than a generic "couldn't load" — the setup steps are things
// only Eric can do, and he won't remember them a season from now.
const FIXES: Record<string, { title: string; how: string }> = {
  not_configured: {
    title: "Yahoo isn't set up yet",
    how: "Add YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy.",
  },
  not_connected: {
    title: "Sign in to Yahoo once",
    how: "On a phone or laptop, open erics-movies.vercel.app/api/yahoo/login and sign in. It shows a token to save as YAHOO_REFRESH_TOKEN in Vercel — after that this never asks again.",
  },
  unavailable: {
    title: "Live data needs the deployed app",
    how: "The Yahoo endpoints only run on Vercel, so this stays empty under local dev.",
  },
  rate_limited: {
    title: "Too many requests",
    how: "Yahoo data is throttled to protect the account. Give it a minute and reload.",
  },
};

export default function YahooNotice() {
  const { state, code, message } = useYahoo();

  if (state === "loading") {
    return <div className="card h-24 shimmer" aria-label="loading league" />;
  }

  const fix = (code && FIXES[code]) || {
    title: "Couldn't reach Yahoo",
    how: message || "Try again in a moment.",
  };

  return (
    <div className="card p-5">
      <div className="u-display text-xl text-cream">{fix.title}</div>
      <p className="mt-1 max-w-2xl text-sm text-cream/70">{fix.how}</p>
      <button onClick={() => connectYahoo(true)} data-focusable className="btn-ghost mt-4 !py-1.5 !text-xs">
        Try again
      </button>
    </div>
  );
}
