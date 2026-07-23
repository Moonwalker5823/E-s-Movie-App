import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import MyTeams from "../components/fantasy/MyTeams";
import Heading from "../components/ui/Heading";

const LEAGUES = [
  { name: "Yahoo Fantasy", url: "https://football.fantasysports.yahoo.com/", blurb: "Open your league", color: "#6001d2" },
  { name: "ESPN Fantasy", url: "https://fantasy.espn.com/football/", blurb: "Open your league", color: "#c8102e" },
  { name: "Sleeper", url: "https://sleeper.com/", blurb: "Open your league", color: "#ff4d6d" },
];

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
            <motion.a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              data-focusable
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-line p-5 shadow-card"
              style={{ background: `linear-gradient(160deg, ${l.color}, #0b0b12)` }}
            >
              <div className="font-display text-2xl text-cream">{l.name}</div>
              <div className="mt-1 text-xs text-cream/70">{l.blurb} ↗</div>
            </motion.a>
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
