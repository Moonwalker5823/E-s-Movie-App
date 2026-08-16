import { useEffect } from "react";
import Heading from "../../ui/Heading";
import WeekNav from "./WeekNav";
import YahooNotice from "./YahooNotice";
import { yahooScoreboard, yahooStandings, type YahooMatchup, type YahooTeam } from "../../../api/yahoo";
import { connectYahoo, recordOf, useYahoo } from "../../../lib/fantasy/yahoo";
import { useAsync } from "../../../lib/useAsync";

// The whole league at a glance: every matchup for the selected week, then the standings.

function ScoreCard({ m, myKey }: { m: YahooMatchup; myKey: string }) {
  const live = m.status === "midevent";
  const done = m.status === "postevent";
  const scored = live || done;
  const involvesMe = m.teams.some((t) => t.teamKey === myKey);

  return (
    <div className={`card p-3 ${involvesMe ? "ring-2 ring-spray/60" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="u-label !rotate-0 text-[10px]">{m.isPlayoffs ? "Playoffs" : `Week ${m.week}`}</span>
        <span className={`sticker ${live ? "bg-live text-ink" : done ? "bg-white/10 text-cream/70" : "bg-cyan text-ink"}`}>
          {live ? "● Live" : done ? "Final" : "Upcoming"}
        </span>
      </div>
      {m.teams.map((t) => {
        const won = done && m.winnerTeamKey === t.teamKey;
        return (
          <div key={t.teamKey} className="flex items-center justify-between gap-2 py-1">
            <span className={`min-w-0 truncate text-sm ${won ? "font-bold text-cream" : "text-cream/70"}`}>
              {t.teamKey === myKey && "★ "}
              {t.name}
            </span>
            <span className={`shrink-0 font-display text-lg ${won ? "text-lime" : "text-cream/80"}`}>
              {(scored ? t.points : t.projected || t.points).toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StandingsRow({ t, myKey }: { t: YahooTeam; myKey: string }) {
  const mine = t.teamKey === myKey;
  return (
    <div className={`flex items-center gap-3 border-b border-line px-3 py-2 last:border-0 ${mine ? "bg-spray/10" : ""}`}>
      <span className="w-6 shrink-0 font-display text-lg text-cream/50">{t.rank || "—"}</span>
      <span className={`min-w-0 flex-1 truncate text-sm ${mine ? "font-bold text-cream" : "text-cream/80"}`}>
        {mine && "★ "}
        {t.name}
        {t.manager && <span className="ml-2 text-xs text-cream/40">{t.manager}</span>}
      </span>
      <span className="w-16 shrink-0 text-right font-display text-base text-cream">{recordOf(t)}</span>
      <span className="hidden w-20 shrink-0 text-right text-sm text-cream/60 sm:block">{t.pointsFor.toFixed(1)}</span>
      <span className="hidden w-20 shrink-0 text-right text-sm text-cream/40 sm:block">{t.pointsAgainst.toFixed(1)}</span>
    </div>
  );
}

export default function YahooLeagueTab() {
  const yahoo = useYahoo();
  const ready = yahoo.state === "ready" && Boolean(yahoo.league);
  const leagueKey = yahoo.league?.leagueKey;
  const myKey = yahoo.myTeam?.teamKey || "";

  useEffect(() => {
    connectYahoo();
  }, []);

  const board = useAsync(() => yahooScoreboard(leagueKey, yahoo.week), [leagueKey, yahoo.week], ready);
  const standings = useAsync(() => yahooStandings(leagueKey), [leagueKey], ready);

  if (!ready) return <YahooNotice />;

  const matchups = board.data?.matchups || [];
  const teams = standings.data?.teams || [];

  return (
    <div className="space-y-6">
      <WeekNav label="Scoreboard" />

      {board.loading && !matchups.length && <div className="card h-40 shimmer" aria-label="loading scoreboard" />}
      {board.error && !matchups.length && <p className="text-sm text-spray">Couldn't load the scoreboard — {board.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {matchups.map((m, i) => (
          <ScoreCard key={m.teams.map((t) => t.teamKey).join("-") || i} m={m} myKey={myKey} />
        ))}
      </div>

      <section>
        <Heading emoji="📊" className="mb-3">
          Standings
        </Heading>
        {standings.loading && !teams.length && <div className="card h-64 shimmer" aria-label="loading standings" />}
        {standings.error && !teams.length && (
          <p className="text-sm text-spray">Couldn't load the standings — {standings.error}</p>
        )}
        {Boolean(teams.length) && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-white/5 px-3 py-2 text-xs uppercase tracking-wide text-cream/50">
              <span className="w-6 shrink-0">#</span>
              <span className="flex-1">Team</span>
              <span className="w-16 shrink-0 text-right">W-L</span>
              <span className="hidden w-20 shrink-0 text-right sm:block">PF</span>
              <span className="hidden w-20 shrink-0 text-right sm:block">PA</span>
            </div>
            {teams.map((t) => (
              <StandingsRow key={t.teamKey} t={t} myKey={myKey} />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-cream/40">
        Live from Yahoo · {yahoo.league?.name} · {yahoo.league?.season}
      </p>
    </div>
  );
}
