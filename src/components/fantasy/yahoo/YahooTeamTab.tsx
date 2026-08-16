import { useEffect } from "react";
import WeekNav from "./WeekNav";
import YahooNotice from "./YahooNotice";
import { yahooRoster, yahooScoreboard, type YahooPlayer } from "../../../api/yahoo";
import { connectYahoo, useYahoo } from "../../../lib/fantasy/yahoo";
import { useAsync } from "../../../lib/useAsync";

// Your real Yahoo roster for the selected week — starters, bench, and what everyone
// actually scored. This is the live counterpart to the Draft Room's local board.

const POS_COLOR: Record<string, string> = {
  QB: "text-cyan",
  RB: "text-lime",
  WR: "text-sprayhi",
  TE: "text-yellow",
  K: "text-purple",
  DEF: "text-live",
};

/** Yahoo only fills `status` when something's wrong, so any value is worth flagging. */
function StatusTag({ status }: { status: string }) {
  if (!status) return null;
  const bad = /^(O|Out|IR|SUSP|NA)/i.test(status);
  return (
    <span className={`sticker !rotate-0 ${bad ? "bg-spray text-cream" : "bg-yellow text-ink"}`}>
      {status.slice(0, 12)}
    </span>
  );
}

function PlayerRow({ p }: { p: YahooPlayer }) {
  const empty = !p.name;
  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0">
      <span className="w-12 shrink-0 font-display text-sm uppercase text-cream/60">{p.slot}</span>
      {empty ? (
        <span className="flex-1 text-sm italic text-cream/40">Empty</span>
      ) : (
        <>
          <span className="min-w-0 flex-1">
            <span className="truncate text-sm text-cream">{p.name}</span>{" "}
            <span className={`text-xs ${POS_COLOR[p.pos] || "text-cream/60"}`}>{p.pos}</span>{" "}
            <span className="text-xs text-cream/50">{p.team || "FA"}</span>{" "}
            {p.bye > 0 && <span className="text-xs text-cream/35">bye {p.bye}</span>}
          </span>
          <StatusTag status={p.status} />
          <span className="w-14 shrink-0 text-right font-display text-lg text-cream">{p.points.toFixed(1)}</span>
        </>
      )}
    </div>
  );
}

function Group({ title, players }: { title: string; players: YahooPlayer[] }) {
  if (!players.length) return null;
  const total = players.reduce((sum, p) => sum + p.points, 0);
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-white/5 px-3 py-2">
        <span className="u-label !rotate-0 text-xs">{title}</span>
        <span className="font-display text-lg text-lime">{total.toFixed(1)}</span>
      </div>
      {players.map((p) => (
        <PlayerRow key={p.playerKey || `${p.slot}-${p.name}`} p={p} />
      ))}
    </section>
  );
}

export default function YahooTeamTab() {
  const yahoo = useYahoo();
  const ready = yahoo.state === "ready" && Boolean(yahoo.myTeam);
  const teamKey = yahoo.myTeam?.teamKey || "";
  const leagueKey = yahoo.league?.leagueKey;

  useEffect(() => {
    connectYahoo();
  }, []);

  const roster = useAsync(() => yahooRoster(teamKey, yahoo.week), [teamKey, yahoo.week], ready);
  const board = useAsync(() => yahooScoreboard(leagueKey, yahoo.week), [leagueKey, yahoo.week], ready);

  if (!ready) return <YahooNotice />;

  const players = roster.data?.players || [];
  const starters = players.filter((p) => p.slot && p.slot !== "BN" && p.slot !== "IR");
  const bench = players.filter((p) => p.slot === "BN");
  const ir = players.filter((p) => p.slot === "IR");

  const matchup = board.data?.matchups.find((m) => m.teams.some((t) => t.teamKey === teamKey));
  const me = matchup?.teams.find((t) => t.teamKey === teamKey);
  const opp = matchup?.teams.find((t) => t.teamKey !== teamKey);

  return (
    <div className="space-y-6">
      <WeekNav label="My Team" />

      {/* Scoreline for the week you're looking at. */}
      {me && opp && (
        <div className="card flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="truncate text-xs uppercase tracking-wide text-cream/60">{me.name}</div>
            <div className="font-display text-3xl text-lime">{me.points.toFixed(1)}</div>
          </div>
          <span className="font-tag text-sm text-cream/40">vs</span>
          <div className="min-w-0 text-right">
            <div className="truncate text-xs uppercase tracking-wide text-cream/60">{opp.name}</div>
            <div className="font-display text-3xl text-cream/80">{opp.points.toFixed(1)}</div>
          </div>
        </div>
      )}

      {roster.loading && !players.length && <div className="card h-64 shimmer" aria-label="loading roster" />}
      {roster.error && !players.length && (
        <p className="text-sm text-spray">Couldn't load your roster — {roster.error}</p>
      )}

      <Group title="Starters" players={starters} />
      <Group title="Bench" players={bench} />
      <Group title="Injured Reserve" players={ir} />

      {!roster.loading && !players.length && !roster.error && (
        <p className="text-sm text-cream/50">No roster for week {yahoo.week} yet.</p>
      )}

      <p className="pt-1 text-xs text-cream/40">Live from Yahoo · {yahoo.league?.name}</p>
    </div>
  );
}
