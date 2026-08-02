import { useState } from "react";
import { useTeam, teamRoster, importFromDraft, clearTeam, syncSleeperRoster } from "../../../lib/fantasy/team";
import { useLeague, setCurrentWeek } from "../../../lib/fantasy/league";
import { useBoard } from "../../../lib/fantasy/board";
import { myRoster } from "../../../lib/fantasy/draft";
import WeeklyChecklist from "./WeeklyChecklist";
import LineupBoard from "./LineupBoard";
import StartSitCard from "./StartSitCard";
import WaiverBoard from "./WaiverBoard";
import TradeIdeas from "./TradeIdeas";

export default function ThisWeekTab() {
  useTeam();
  useBoard();
  const league = useLeague();
  const week = league.currentWeek;
  const roster = teamRoster();
  const draftCount = myRoster().length;
  const canSync = league.connection.provider === "sleeper" && Boolean(league.connection.sleeperLeagueId);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  const doSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    const r = await syncSleeperRoster();
    setSyncMsg(r.msg);
    setSyncing(false);
  };

  return (
    <div className="space-y-6">
      {/* Week selector + roster status */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <div className="u-label mb-1">This Week</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(week - 1)}
              data-focusable
              aria-label="previous week"
              className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream hover:bg-white/20"
            >
              −
            </button>
            <span className="w-24 text-center font-display text-2xl text-cream">Week {week}</span>
            <button
              onClick={() => setCurrentWeek(week + 1)}
              data-focusable
              aria-label="next week"
              className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream hover:bg-white/20"
            >
              +
            </button>
          </div>
        </div>
        {roster.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-cream/60">
            <span>{roster.length} on roster</span>
            <button onClick={() => clearTeam()} data-focusable className="btn-ghost !px-2.5 !py-1 text-xs">
              Clear
            </button>
          </div>
        )}
      </div>

      {roster.length === 0 ? (
        <div className="card p-5">
          <h3 className="font-display text-2xl text-cream">Load your team</h3>
          <p className="mt-1 text-sm text-cream/60">
            Bring in your roster to unlock lineups, waivers, and trade ideas for the week.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {draftCount > 0 && (
              <button onClick={importFromDraft} data-focusable className="btn-spray text-sm">
                Import from draft ({draftCount})
              </button>
            )}
            {canSync && (
              <button onClick={doSync} data-focusable disabled={syncing} className="btn-ghost text-sm disabled:opacity-50">
                {syncing ? "Syncing…" : "Sync from Sleeper"}
              </button>
            )}
          </div>
          {syncMsg && <p className="mt-2 text-xs text-cream/60">{syncMsg}</p>}
          <p className="mt-3 text-xs text-cream/60">
            No draft yet? Draft your team in the Draft Room, or connect Sleeper in My Team → League Settings.
          </p>
        </div>
      ) : (
        <>
          <WeeklyChecklist week={week} />
          <div className="grid gap-6 lg:grid-cols-2">
            <StartSitCard />
            <WaiverBoard />
          </div>
          <LineupBoard week={week} />
          <TradeIdeas />
        </>
      )}
    </div>
  );
}
