import { useEffect } from "react";
import { yahooScoreboard, yahooStandings, type YahooMatchup, type YahooTeam } from "../../../api/yahoo";
import { connectYahoo, ordinal, recordOf, useYahoo } from "../../../lib/fantasy/yahoo";
import { useAsync } from "../../../lib/useAsync";

// The Fantasy hub's headline card. Live (record, rank, this week's score) once Yahoo is
// connected; otherwise the plain deep-link into the league that's always worked, so the
// hub never degrades to an error box.

const FALLBACK = {
  name: "Jones Family League",
  team: "Moonwalker",
  url: "https://football.fantasysports.yahoo.com/f1/1261152",
};

const SHELL =
  "mb-6 flex items-center justify-between gap-4 rounded-2xl border border-line " +
  "bg-gradient-to-r from-[#2a0a4a] via-[#1a0730] to-[#0b0b12] p-5 shadow-card transition hover:brightness-110";

/** One side of the matchup. Before kickoff Yahoo only has a projection, so show that. */
function Side({ team, mine, scored }: { team: YahooTeam; mine: boolean; scored: boolean }) {
  return (
    <div className={mine ? "text-cream" : "text-cream/70"}>
      <div className="max-w-[7rem] truncate text-xs uppercase tracking-wide">{team.name}</div>
      <div className={`font-display text-2xl leading-none sm:text-3xl ${mine ? "text-lime" : ""}`}>
        {(scored ? team.points : team.projected || team.points).toFixed(1)}
      </div>
    </div>
  );
}

function Matchup({ matchup, myKey }: { matchup: YahooMatchup; myKey: string }) {
  const live = matchup.status === "midevent";
  const done = matchup.status === "postevent";
  const [a, b] = matchup.teams;
  if (!a || !b) return null;

  return (
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <Side team={a} mine={a.teamKey === myKey} scored={live || done} />
      <span className="font-tag text-xs text-cream/40">vs</span>
      <Side team={b} mine={b.teamKey === myKey} scored={live || done} />
      <span className={`sticker ${live ? "bg-live text-ink" : done ? "bg-white/10 text-cream/70" : "bg-cyan text-ink"}`}>
        {live ? "● Live" : done ? "Final" : `Wk ${matchup.week}`}
      </span>
    </div>
  );
}

export default function LeagueCard() {
  const yahoo = useYahoo();
  const ready = yahoo.state === "ready" && Boolean(yahoo.league && yahoo.myTeam);
  const leagueKey = yahoo.league?.leagueKey;
  const myKey = yahoo.myTeam?.teamKey || "";

  useEffect(() => {
    connectYahoo();
  }, []);

  // Two cheap, separately-cached reads: the standings row carries the record/rank,
  // the scoreboard carries this week's live score.
  const standings = useAsync(() => yahooStandings(leagueKey), [leagueKey], ready);
  const board = useAsync(() => yahooScoreboard(leagueKey, yahoo.week), [leagueKey, yahoo.week], ready);

  if (!ready) {
    return (
      <a href={FALLBACK.url} target="_blank" rel="noreferrer" data-focusable className={SHELL}>
        <div className="min-w-0">
          <div className="u-label !rotate-0 text-[10px] text-cyan">Yahoo Fantasy · Team: {FALLBACK.team}</div>
          <div className="u-display truncate text-2xl text-cream sm:text-3xl">🏆 {FALLBACK.name}</div>
          <div className="mt-1 text-sm text-cream/70">
            {yahoo.state === "loading" ? "Checking for live data…" : "Standings, matchups & your roster"}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-spray px-4 py-2 text-sm font-bold text-ink">Open ↗</span>
      </a>
    );
  }

  const league = yahoo.league!;
  const me = standings.data?.teams.find((t) => t.teamKey === myKey) || yahoo.myTeam!;
  const mine = board.data?.matchups.find((m) => m.teams.some((t) => t.teamKey === myKey)) || null;

  return (
    <a href={league.url || FALLBACK.url} target="_blank" rel="noreferrer" data-focusable className={SHELL}>
      <div className="min-w-0">
        <div className="u-label !rotate-0 text-[10px] text-cyan">
          Yahoo Fantasy · {league.season} · Team: {yahoo.myTeam!.name}
        </div>
        <div className="u-display truncate text-2xl text-cream sm:text-3xl">🏆 {league.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cream/70">
          <span className="font-bold text-cream">{recordOf(me)}</span>
          <span>
            {ordinal(me.rank)} of {league.teams}
          </span>
          {me.streak && <span className="text-cream/50">{me.streak} streak</span>}
          {me.pointsFor > 0 && <span className="text-cream/50">{me.pointsFor.toFixed(1)} PF</span>}
        </div>
      </div>

      {mine ? (
        <Matchup matchup={mine} myKey={myKey} />
      ) : (
        <span className="shrink-0 rounded-full bg-spray px-4 py-2 text-sm font-bold text-ink">
          {board.loading ? "…" : "Open ↗"}
        </span>
      )}
    </a>
  );
}
