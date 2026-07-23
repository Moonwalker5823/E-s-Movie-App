import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { teamInfo, type TeamInfo } from "../../api/espn";
import Heading from "../ui/Heading";

// Eric's teams (+ UConn soft spot). path = ESPN sport/league, id = team id/abbr.
const MY_TEAMS = [
  { label: "Giants", path: "football/nfl", id: "nyg" },
  { label: "Bulls", path: "basketball/nba", id: "chi" },
  { label: "Mets", path: "baseball/mlb", id: "nym" },
  { label: "Tar Heels", path: "basketball/mens-college-basketball", id: "153" },
  { label: "UConn", path: "basketball/mens-college-basketball", id: "41" },
];

function fmtDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric" });
}

function TeamCard({ label, info }: { label: string; info: TeamInfo | null }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="card p-4" style={{ boxShadow: info?.color ? `inset 4px 0 0 ${info.color}` : undefined }}>
      <div className="flex items-center gap-3">
        {info?.logo ? <img src={info.logo} alt="" className="h-10 w-10" /> : <div className="h-10 w-10 rounded bg-white/10" />}
        <div>
          <div className="u-label !rotate-0 text-cyan text-[10px]">{label}</div>
          <div className="font-display text-xl text-cream">{info?.record ?? "…"}</div>
        </div>
      </div>
      {info?.standing && <div className="mt-2 text-xs text-cream/50">{info.standing}</div>}
      {info?.nextName && (
        <div className="mt-2 border-t border-line pt-2 text-xs text-cream/70">
          <span className="text-cream/40">Next: </span>
          {info.nextName} · {fmtDate(info.nextDate)}
          {info.nextBroadcast ? ` · ${info.nextBroadcast}` : ""}
        </div>
      )}
    </motion.div>
  );
}

/** Dashboard of Eric's teams — record + next game. */
export default function MyTeams() {
  const [data, setData] = useState<Record<string, TeamInfo | null>>({});

  useEffect(() => {
    MY_TEAMS.forEach((t) => {
      teamInfo(t.path, t.id)
        .then((info) => setData((d) => ({ ...d, [t.label]: info })))
        .catch(() => setData((d) => ({ ...d, [t.label]: null })));
    });
  }, []);

  return (
    <section>
      <Heading label="♛ My Teams" emoji="🏟️">
        Eric&apos;s Squads
      </Heading>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {MY_TEAMS.map((t) => (
          <TeamCard key={t.label} label={t.label} info={data[t.label] ?? null} />
        ))}
      </div>
    </section>
  );
}
