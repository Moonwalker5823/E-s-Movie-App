import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MyTeams from "./MyTeams";
import LeagueCard from "./yahoo/LeagueCard";
import { useSettings } from "../../lib/settings";

/** The Fantasy home tab — your Yahoo league (live when connected), the Draft Room CTA,
 *  and your teams. */
export default function HubTab() {
  const { accessCode } = useSettings();
  return (
    <div>
      {/* Your league — live record + this week's score, and one tap into Yahoo. */}
      <LeagueCard />

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

      {/* My teams */}
      <div className="mt-10">
        <MyTeams />
      </div>
    </div>
  );
}
