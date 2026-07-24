import { LEAGUES, type Game, type League, type Team } from "../api/espn";
import Skeleton from "./ui/Skeleton";

// Compact team line for the rail: logo + abbreviation + score.
function ScoreLine({ t, showScore }: { t: Team; showScore: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="flex min-w-0 items-center gap-1.5">
        {t.logo ? <img src={t.logo} alt="" className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
        <span className={`truncate text-xs font-semibold ${t.winner ? "text-cream" : "text-cream/70"}`}>
          {t.abbreviation || t.displayName}
        </span>
      </span>
      {showScore && <span className="u-display shrink-0 text-sm text-cream">{t.score ?? "-"}</span>}
    </div>
  );
}

function MiniGame({ g }: { g: Game }) {
  const live = g.state === "in";
  const showScore = live || g.state === "post";
  return (
    <div
      className="rounded-lg border border-line bg-black/20 p-2"
      style={{ boxShadow: live ? "inset 0 0 0 1px rgba(53,208,127,.5)" : undefined }}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
        <span className={live ? "font-bold text-live" : "text-cream/45"}>
          {live && "● "}
          {g.statusDetail}
        </span>
        {g.broadcasts[0] && <span className="truncate text-cream/40">{g.broadcasts[0]}</span>}
      </div>
      <ScoreLine t={g.away} showScore={showScore} />
      <ScoreLine t={g.home} showScore={showScore} />
    </div>
  );
}

/**
 * The live scores/stats rail shown beside the Sports viewer. Compact league chips at
 * the top drive the SAME league state as the full board below, so the two stay in
 * sync. Live games float to the top and are highlighted.
 */
export default function ScoreRail({
  league,
  onLeague,
  games,
  error,
}: {
  league: League;
  onLeague: (l: League) => void;
  games: Game[] | null;
  error: boolean;
}) {
  // Live first, then upcoming, then finals — the most watchable order for a rail.
  const sorted = games
    ? [...games].sort((a, b) => {
        const rank = (s: Game["state"]) => (s === "in" ? 0 : s === "pre" ? 1 : 2);
        return rank(a.state) - rank(b.state);
      })
    : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="u-display text-sm text-cream">📊 Live Scores</h3>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {LEAGUES.map((l) => (
          <button
            key={l.key}
            onClick={() => onLeague(l)}
            data-focusable
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
              league.key === l.key ? "bg-spray text-ink" : "bg-white/10 text-cream/70 hover:bg-white/20"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-xs text-cream/50">Scores unavailable right now.</p>
      ) : sorted === null ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-xs text-cream/50">No {league.label} games today.</p>
      ) : (
        <div className="space-y-2">
          {sorted.slice(0, 12).map((g) => (
            <MiniGame key={g.id} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}
