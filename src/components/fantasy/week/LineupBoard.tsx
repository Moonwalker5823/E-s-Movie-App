import { useState } from "react";
import { useTeam, teamRoster } from "../../../lib/fantasy/team";
import { useLeague } from "../../../lib/fantasy/league";
import { useBoard } from "../../../lib/fantasy/board";
import { useWeek, lineupFor, setLineup, setSlot } from "../../../lib/fantasy/week";
import { slotsFor, eligible, autoFill } from "../../../lib/fantasy/lineup";

/** Set your weekly lineup on the TV: focus a slot, then pick from the eligible players.
 *  No drag-drop (there's no pointer on a remote). "Auto-set" fills it bye-aware. */
export default function LineupBoard({ week }: { week: number }) {
  useTeam();
  useWeek();
  useLeague();
  useBoard();
  const roster = teamRoster();
  const slots = slotsFor();
  const lineup = lineupFor(week);
  const [sel, setSel] = useState<string | null>(null);

  const byId = new Map(roster.map((p) => [p.id, p]));
  const assignedIds = new Set(Object.values(lineup).filter(Boolean) as string[]);

  const assign = (slotId: string, playerId: string | null) => {
    setSlot(week, slotId, playerId);
    setSel(null);
  };

  const eligibleFor = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId)!;
    return roster.filter((p) => eligible(slot, p) && (!assignedIds.has(p.id) || lineup[slotId] === p.id));
  };

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl text-cream">Lineup · Week {week}</h3>
        <button onClick={() => setLineup(week, autoFill(roster, week))} data-focusable className="btn-spray !px-3 !py-1 text-xs">
          ⚡ Auto-set
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => {
          const pid = lineup[slot.id];
          const p = pid ? byId.get(pid) : null;
          const onBye = p && week > 0 && p.bye === week;
          const open = sel === slot.id;
          return (
            <div key={slot.id}>
              <button
                onClick={() => setSel(open ? null : slot.id)}
                data-focusable
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                  onBye ? "border-spray/50 bg-spray/5" : "border-line bg-white/5"
                }`}
              >
                <span className="w-14 shrink-0 font-display text-cream/70">{slot.label}</span>
                {p ? (
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-cream">{p.name}</span>{" "}
                    <span className="text-xs text-cream/60">
                      {p.pos}-{p.team}
                      {onBye ? " · BYE" : ""}
                    </span>
                  </span>
                ) : (
                  <span className="flex-1 text-cream/60">Empty — tap to fill</span>
                )}
                <span className="text-cream/55">{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <div className="ml-14 mt-1 flex flex-wrap gap-1.5">
                  {eligibleFor(slot.id).map((cp) => (
                    <button
                      key={cp.id}
                      onClick={() => assign(slot.id, cp.id)}
                      data-focusable
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        lineup[slot.id] === cp.id ? "border-spray bg-spray/20 text-cream" : "border-line bg-white/5 text-cream/80"
                      }`}
                    >
                      {cp.name} <span className="text-cream/60">{cp.pos}{week > 0 && cp.bye === week ? "·BYE" : ""}</span>
                    </button>
                  ))}
                  {lineup[slot.id] && (
                    <button onClick={() => assign(slot.id, null)} data-focusable className="rounded-lg border border-line px-2 py-1 text-xs text-cream/50">
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bench */}
      <div className="mt-4">
        <div className="u-label mb-1">Bench</div>
        <div className="flex flex-wrap gap-1.5">
          {roster.filter((p) => !assignedIds.has(p.id)).map((p) => (
            <span key={p.id} className="rounded-lg border border-line bg-white/5 px-2 py-1 text-xs text-cream/70">
              {p.name} <span className="text-cream/60">{p.pos}</span>
            </span>
          ))}
          {roster.filter((p) => !assignedIds.has(p.id)).length === 0 && (
            <span className="text-xs text-cream/60">Everyone's starting.</span>
          )}
        </div>
      </div>
    </div>
  );
}
