import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MyTeams from "../components/fantasy/MyTeams";
import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";
import { FANTASY_SITES } from "../lib/services";

// Leagues come from the single source of truth (FANTASY_SITES); add one there
// and it shows up here and in Settings automatically.
const LEAGUES: Tile[] = FANTASY_SITES.map((f) => ({
  name: f.name,
  url: f.loginUrl,
  blurb: "Open your league",
  color: f.color,
}));

export default function Fantasy() {
  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Fantasy Football" emoji="🏈" size="xl">
        The League
      </Heading>
      <p className="mt-2 text-cream/60">Draft help, scouting, and your teams — built to run on the TV.</p>

      {/* Draft Room CTA */}
      <Link to="/fantasy/draft" data-focusable className="mt-6 block">
        <motion.div
          whileHover={{ y: -4 }}
          className="frame overflow-hidden bg-gradient-to-r from-spraylo via-spray to-purple p-6"
        >
          <div className="u-label !rotate-0 text-ink">Live · AI Powered</div>
          <div className="u-display text-4xl text-cream sm:text-5xl">Enter the Draft Room →</div>
          <p className="mt-1 max-w-xl text-sm text-cream/90">
            Big-screen draft board with an AI assistant that recommends your pick, answers questions,
            and scouts players live. Mark picks as they happen and it tracks your roster & needs.
          </p>
        </motion.div>
      </Link>

      {/* League launchers */}
      <div className="mt-8">
        <Heading emoji="🔗" className="mb-3">Open Your League</Heading>
        <p className="mb-3 text-sm text-cream/50">
          Yahoo &amp; ESPN need a login to sync, so the draft room runs alongside your league site
          (mark picks as they go). Tap to open your league:
        </p>
        <div className="grid grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-3">
          {LEAGUES.map((l) => (
            <LaunchTile key={l.name} t={l} />
          ))}
        </div>
      </div>

      {/* My teams */}
      <div className="mt-10">
        <MyTeams />
      </div>
    </div>
  );
}
