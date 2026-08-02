import Chip from "../ui/Chip";
import {
  useLeague,
  setTeams,
  setScoringPreset,
  setScoringStat,
  setRosterSlot,
  setConnection,
  resetLeague,
  type ScoringPreset,
  type ProviderId,
} from "../../lib/fantasy/league";
import type { RosterSettings } from "../../lib/fantasy/types";

// One +/- stepper row, remote-navigable.
function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const round = (v: number) => Math.round(v * 100) / 100;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/5 px-3 py-2">
      <span className="text-sm font-semibold text-cream">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(round(Math.max(min, value - step)))}
          data-focusable
          aria-label={`decrease ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream transition hover:bg-white/20"
        >
          −
        </button>
        <span className="w-10 text-center font-display text-lg text-cream">
          {value}
          {suffix}
        </span>
        <button
          onClick={() => onChange(round(Math.min(max, value + step)))}
          data-focusable
          aria-label={`increase ${label}`}
          className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream transition hover:bg-white/20"
        >
          +
        </button>
      </div>
    </div>
  );
}

const PROVIDERS: { key: ProviderId; label: string }[] = [
  { key: "sleeper", label: "Sleeper" },
  { key: "espn", label: "ESPN" },
  { key: "manual", label: "Manual" },
];

const PRESETS: { key: ScoringPreset; label: string }[] = [
  { key: "standard", label: "Standard" },
  { key: "half", label: "Half PPR" },
  { key: "ppr", label: "Full PPR" },
  { key: "custom", label: "Custom" },
];

// Roster slots in draft order (SUPERFLEX before K/DST).
const SLOTS: { key: keyof RosterSettings; label: string }[] = [
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
  { key: "FLEX", label: "FLEX (RB/WR/TE)" },
  { key: "SUPERFLEX", label: "SUPERFLEX (QB/RB/WR/TE)" },
  { key: "K", label: "K" },
  { key: "DST", label: "DST" },
  { key: "BENCH", label: "Bench" },
];

/** Edit the league's rules — teams, scoring, and roster slots. Everything the draft
 *  brain and weekly lineup tools read comes from here. */
export default function LeagueSettings() {
  const league = useLeague();
  const { scoring, roster, connection } = league;

  return (
    <div className="space-y-6">
      {/* Connect a live league (optional — the Sleeper board & waivers work without it) */}
      <div className="card p-4">
        <h3 className="mb-1 font-display text-2xl text-cream">Connect Your League</h3>
        <p className="mb-3 text-xs text-cream/50">
          Optional. Sleeper syncs your roster, matchups &amp; waivers for free — no login. Player
          rankings already pull from Sleeper regardless.
        </p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <Chip key={p.key} active={connection.provider === p.key} onClick={() => setConnection({ provider: p.key })}>
              {p.label}
            </Chip>
          ))}
        </div>
        {connection.provider === "sleeper" && (
          <div className="mt-3 grid gap-2 sm:max-w-md sm:grid-cols-2">
            <input
              defaultValue={connection.sleeperLeagueId || ""}
              onBlur={(e) => setConnection({ sleeperLeagueId: e.target.value.trim() })}
              data-focusable
              placeholder="Sleeper league ID"
              className="rounded-lg border-2 border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-spray/50"
            />
            <input
              defaultValue={connection.sleeperUser || ""}
              onBlur={(e) => setConnection({ sleeperUser: e.target.value.trim() })}
              data-focusable
              placeholder="Sleeper username"
              className="rounded-lg border-2 border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-spray/50"
            />
          </div>
        )}
        {connection.provider === "espn" && (
          <p className="mt-3 text-xs text-cream/50">
            ESPN private leagues need a server connection (coming soon). Use Manual + the free Sleeper
            board for now.
          </p>
        )}
      </div>

      {/* Teams + scoring */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-2xl text-cream">League Rules</h3>
          <button
            onClick={() => confirm("Reset league settings to 10-team Standard?") && resetLeague()}
            data-focusable
            className="btn-ghost !px-3 !py-1 text-xs"
          >
            Reset
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Teams" value={league.teams} onChange={setTeams} min={2} max={20} />
        </div>

        <div className="mt-4">
          <div className="u-label mb-2">Scoring</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip key={p.key} active={scoring.preset === p.key} onClick={() => setScoringPreset(p.key)}>
                {p.label}
              </Chip>
            ))}
          </div>
          {scoring.preset === "custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Stepper label="Per reception" value={scoring.rec} onChange={(v) => setScoringStat("rec", v)} min={0} max={2} step={0.5} suffix=" pt" />
              <Stepper label="Passing TD" value={scoring.passTD} onChange={(v) => setScoringStat("passTD", v)} min={0} max={10} step={1} suffix=" pt" />
              <Stepper label="Interception" value={scoring.passInt} onChange={(v) => setScoringStat("passInt", v)} min={-10} max={0} step={1} suffix=" pt" />
              <Stepper label="Fumble lost" value={scoring.fumble} onChange={(v) => setScoringStat("fumble", v)} min={-10} max={0} step={1} suffix=" pt" />
            </div>
          )}
          <p className="mt-2 text-xs text-cream/60">
            {scoring.preset === "standard"
              ? "No points per reception — leans RB-heavy."
              : scoring.preset === "half"
                ? "0.5 pts per reception."
                : scoring.preset === "ppr"
                  ? "1 pt per reception — boosts WRs & pass-catching RBs."
                  : "Custom scoring."}
          </p>
        </div>
      </div>

      {/* Roster slots */}
      <div className="card p-4">
        <h3 className="mb-3 font-display text-2xl text-cream">Roster</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {SLOTS.map((s) => (
            <Stepper
              key={s.key}
              label={s.label}
              value={roster[s.key]}
              onChange={(v) => setRosterSlot(s.key, v)}
              min={0}
              max={s.key === "BENCH" ? 12 : 4}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
