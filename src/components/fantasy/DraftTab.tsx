import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDraft, myRoster, available, bestAvailable } from "../../lib/fantasy/draft";
import { useLeague, starterCount } from "../../lib/fantasy/league";

/** Draft launcher + a quick resume summary of the draft in progress. */
export default function DraftTab() {
  useDraft();
  const { roster: slots, teams } = useLeague();
  const roster = myRoster();
  const pool = available();
  const started = roster.length > 0;
  const pick = started || pool.length ? bestAvailable() : null;
  const totalStarters = starterCount(slots);

  return (
    <div>
      <Link to="/fantasy/draft" data-focusable className="block">
        <motion.div
          whileHover={{ y: -4 }}
          className="frame overflow-hidden bg-gradient-to-r from-spraylo via-spray to-purple p-6"
        >
          <div className="u-label !rotate-0 text-ink">{teams}-team · Live · AI Powered</div>
          <div className="u-display text-4xl text-cream sm:text-5xl">
            {started ? "Back to the Draft Room →" : "Enter the Draft Room →"}
          </div>
          <p className="mt-1 max-w-xl text-sm text-cream/90">
            The big-screen board with AI pick recommendations, live scouting, and roster/need tracking.
          </p>
        </motion.div>
      </Link>

      {/* Resume summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="u-label mb-1">Your roster</div>
          <div className="font-display text-3xl text-cream">
            {roster.length}
            <span className="text-lg text-cream/40"> / {totalStarters + slots.BENCH}</span>
          </div>
          <div className="mt-1 text-xs text-cream/40">{totalStarters} starters + {slots.BENCH} bench</div>
        </div>
        <div className="card p-4 sm:col-span-2">
          <div className="u-label mb-1">On the clock — best available</div>
          {pick ? (
            <>
              <div className="font-display text-2xl text-cream">{pick.recommendation}</div>
              <p className="mt-1 text-sm text-cream/70">{pick.reason}</p>
              {pick.alternates.length > 0 && (
                <p className="mt-1 text-xs text-cream/40">Also: {pick.alternates.join(" · ")}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-cream/50">Board is empty — refresh it in the Draft Room.</p>
          )}
        </div>
      </div>
    </div>
  );
}
