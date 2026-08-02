import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MyTeams from "./MyTeams";
import Heading from "../ui/Heading";
import LaunchTile, { type Tile } from "../LaunchTile";
import { FANTASY_SITES } from "../../lib/services";
import { useSettings } from "../../lib/settings";

// Leagues come from the single source of truth (FANTASY_SITES).
const LEAGUES: Tile[] = FANTASY_SITES.map((f) => ({
  name: f.name,
  url: f.loginUrl,
  blurb: "Open your league",
  color: f.color,
}));

/** The Fantasy home tab — draft CTA, league launchers, and your teams. */
export default function HubTab() {
  const { accessCode } = useSettings();
  return (
    <div>
      {/* Draft Room CTA */}
      <Link to="/fantasy/draft" data-focusable className="block">
        <motion.div
          whileHover={{ y: -4 }}
          className="frame overflow-hidden bg-gradient-to-r from-spraylo via-spray to-purple p-6"
        >
          <div className="u-label !rotate-0 text-ink">{accessCode ? "Live · AI Powered" : "Built-in draft brain"}</div>
          <div className="u-display text-4xl text-cream sm:text-5xl">Enter the Draft Room →</div>
          <p className="mt-1 max-w-xl text-sm text-cream/90">
            Big-screen draft board that recommends your pick, tracks your roster &amp; needs, and scouts
            players. Add your AI access code in Settings to turn on live answers &amp; scouting reports.
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
