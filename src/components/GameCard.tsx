import { motion } from "framer-motion";
import type { Game, Team } from "../api/espn";
import { useSettings } from "../lib/settings";
import { liveServices, type Service } from "../lib/services";

// Which of the user's streaming services carry a given broadcast network's LIVE feed.
// Hulu + Live TV carries the major linear sports channels; the others cover their own
// games. This keeps us from suggesting a service that doesn't actually have the game.
const NETWORK_SERVICES: { match: RegExp; services: string[] }[] = [
  { match: /espn|abc|sec network|acc network/i, services: ["hulu"] },
  { match: /\bfox\b|fs1|fs2|btn|big ten/i, services: ["hulu"] },
  { match: /\bnbc\b|usa network|cnbc|golf channel/i, services: ["hulu", "peacock"] },
  { match: /peacock/i, services: ["peacock"] },
  { match: /\bcbs\b/i, services: ["hulu", "paramount"] },
  { match: /paramount/i, services: ["paramount"] },
  { match: /tnt|tbs|trutv/i, services: ["hulu", "max"] },
  { match: /\bmax\b|bleacher|b\/r/i, services: ["max"] },
  { match: /prime video|amazon/i, services: ["prime"] },
  { match: /tubi/i, services: ["tubi"] },
];

// The user's own services (that carry live sports) which broadcast THIS game's networks.
function servicesForGame(networks: string[], myServices: string[]): Service[] {
  const keys = new Set<string>();
  for (const n of networks) for (const m of NETWORK_SERVICES) if (m.match.test(n)) m.services.forEach((k) => keys.add(k));
  return liveServices(myServices).filter((s) => keys.has(s.key));
}

// Map a broadcast network to where you can watch it LIVE — the broadcaster's own
// live page/app, which hands off to your signed-in app on the TV. Order matters
// (first match wins). Anything unmatched falls back to a web search below.
const LIVE_NETWORKS: { match: RegExp; url: string }[] = [
  { match: /espn|abc|sec network|acc network/i, url: "https://www.espn.com/watch/" },
  { match: /fox|fs1|fs2|btn|big ten/i, url: "https://www.foxsports.com/live" },
  { match: /nbc|peacock|usa network|cnbc|golf channel/i, url: "https://www.peacocktv.com/watch/home" },
  { match: /tnt|tbs|trutv|\bmax\b/i, url: "https://play.max.com/" },
  { match: /cbs|paramount/i, url: "https://www.paramountplus.com/live-tv/" },
  { match: /prime video|amazon/i, url: "https://www.amazon.com/gp/video/storefront" },
  { match: /apple/i, url: "https://tv.apple.com/" },
  { match: /nfl network/i, url: "https://www.nfl.com/network/watch/nfl-network-live" },
  { match: /mlb/i, url: "https://www.mlb.com/live-stream-games" },
  { match: /nba tv/i, url: "https://www.nba.com/watch" },
  { match: /nhl/i, url: "https://www.nhl.com/tv" },
];

// Where to WATCH a live game right now: the carrying broadcaster's live page when we
// recognize the network, otherwise a search for the live stream.
function liveWatchUrl(networks: string[], home: string, away: string) {
  for (const n of networks) {
    const hit = LIVE_NETWORKS.find((x) => x.match.test(n));
    if (hit) return hit.url;
  }
  const q = networks[0] ? `watch ${away} vs ${home} live on ${networks[0]}` : `watch ${away} vs ${home} live`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// Where-to-watch / recap search (pre-game & finals).
function watchLink(networks: string[], home: string, away: string) {
  const q = networks[0] ? `watch ${away} vs ${home} on ${networks[0]}` : `where to watch ${away} vs ${home}`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function TeamRow({ t, showScore }: { t: Team; showScore: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1">
      {t.logo ? (
        <img src={t.logo} alt="" className="h-7 w-7" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
      ) : (
        <span className="h-7 w-7" />
      )}
      <span className={`flex-1 font-semibold ${t.winner ? "text-cream" : "text-cream/70"}`}>{t.displayName}</span>
      {showScore && <span className="u-display text-xl text-cream">{t.score ?? "-"}</span>}
    </div>
  );
}

/** One game: teams, score/status, broadcast network, where-to-watch. */
export default function GameCard({ g }: { g: Game }) {
  const { myServices } = useSettings();
  const live = g.state === "in";
  const showScore = live || g.state === "post";
  // Your services that carry this live game (by its broadcast network).
  const myLive = live ? servicesForGame(g.broadcasts, myServices) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
      style={{ boxShadow: live ? "inset 0 0 0 1px rgba(53,208,127,.5)" : undefined }}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className={`flex items-center gap-2 ${live ? "font-bold text-live" : "text-cream/50"}`}>
          {g.league && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-bold uppercase tracking-wide text-cream/70">
              {g.league}
            </span>
          )}
          <span>
            {live && "● "}
            {g.statusDetail}
          </span>
        </span>
        {g.broadcasts.length > 0 && (
          <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 font-semibold text-cream/80">
            {g.broadcasts.join(", ")}
          </span>
        )}
      </div>

      <TeamRow t={g.away} showScore={showScore} />
      <TeamRow t={g.home} showScore={showScore} />

      {live ? (
        <div className="mt-3">
          <div className="mb-1.5 truncate text-xs text-cream/60">{g.venue || ""}</div>
          {myLive.length > 0 ? (
            // Open the game on YOUR services that carry this network. There's no public
            // per-game deep link, so this lands on the service's live area (where the
            // in-progress game is featured) — one tap from kickoff.
            <div className="flex flex-wrap items-center gap-1.5">
              {myLive.map((s) => (
                <a
                  key={s.key}
                  href={s.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-focusable
                  title={`Watch live on ${s.name}`}
                  className="rounded-full px-2.5 py-1 text-xs font-bold text-ink shadow-piece transition hover:brightness-110"
                  style={{ background: s.color }}
                >
                  ▶ {s.name}
                </a>
              ))}
            </div>
          ) : (
            // None of your services carry it (or the network is unknown) — go to the broadcaster.
            <a
              href={liveWatchUrl(g.broadcasts, g.home.displayName, g.away.displayName)}
              target="_blank"
              rel="noreferrer"
              data-focusable
              className="inline-block rounded-full bg-live px-3 py-1 text-xs font-bold text-ink shadow-piece"
            >
              ▶ Watch Live ↗
            </a>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-cream/60">{g.venue || ""}</span>
          <a
            href={watchLink(g.broadcasts, g.home.displayName, g.away.displayName)}
            target="_blank"
            rel="noreferrer"
            data-focusable
            className="shrink-0 rounded-full bg-spray px-3 py-1 text-xs font-bold text-ink"
          >
            {g.state === "pre" ? "Where to watch ↗" : "Watch / recap ↗"}
          </a>
        </div>
      )}
    </motion.div>
  );
}
