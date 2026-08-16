import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MyTeams from "./MyTeams";
import { useSettings } from "../../lib/settings";

// Eric's actual league — the Yahoo "Jones Family League" (team: Moonwalker). Yahoo
// needs a login to sync, so this deep-links straight into the league on Yahoo.
const MY_LEAGUE = {
  name: "Jones Family League",
  team: "Moonwalker",
  url: "https://football.fantasysports.yahoo.com/f1/1261152",
};

/** The Fantasy home tab — your Yahoo league link, the Draft Room CTA, and your teams. */
export default function HubTab() {
  const { accessCode } = useSettings();
  return (
    <div>
      {/* Your league — one tap into the Jones Family League on Yahoo. */}
      <a
        href={MY_LEAGUE.url}
        target="_blank"
        rel="noreferrer"
        data-focusable
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-line bg-gradient-to-r from-[#2a0a4a] via-[#1a0730] to-[#0b0b12] p-5 shadow-card transition hover:brightness-110"
      >
        <div className="min-w-0">
          <div className="u-label !rotate-0 text-[10px] text-cyan">Yahoo Fantasy · Team: {MY_LEAGUE.team}</div>
          <div className="u-display truncate text-2xl text-cream sm:text-3xl">🏆 {MY_LEAGUE.name}</div>
          <div className="mt-1 text-sm text-cream/70">Standings, matchups &amp; your roster</div>
        </div>
        <span className="shrink-0 rounded-full bg-spray px-4 py-2 text-sm font-bold text-ink">Open ↗</span>
      </a>

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
