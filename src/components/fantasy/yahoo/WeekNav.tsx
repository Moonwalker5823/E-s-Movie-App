import { setYahooWeek, useYahoo } from "../../../lib/fantasy/yahoo";

/** Week stepper for the Yahoo tabs. Clamped to the league's own schedule, with a jump
 *  back to the live week once you've wandered off it. */
export default function WeekNav({ label }: { label?: string }) {
  const { league, week } = useYahoo();
  const lo = league?.startWeek || 1;
  const hi = league?.endWeek || 18;
  const current = league?.currentWeek || 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {label && <div className="u-label mb-1">{label}</div>}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYahooWeek(week - 1)}
            disabled={week <= lo}
            data-focusable
            aria-label="previous week"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream hover:bg-white/20 disabled:opacity-30"
          >
            −
          </button>
          <span className="font-display text-xl text-cream">Week {week}</span>
          <button
            onClick={() => setYahooWeek(week + 1)}
            disabled={week >= hi}
            data-focusable
            aria-label="next week"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-lg text-cream hover:bg-white/20 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      {Boolean(current) && week !== current && (
        <button onClick={() => setYahooWeek(current)} data-focusable className="btn-ghost !py-1.5 !text-xs">
          Back to week {current}
        </button>
      )}
    </div>
  );
}
