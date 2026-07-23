import { motion } from "framer-motion";

export interface Tile {
  name: string;
  url: string;
  blurb: string;
  color: string;
}

/** Big launch card that opens an external app/site (Live TV, Games, X). */
export default function LaunchTile({ t }: { t: Tile }) {
  return (
    <motion.a
      href={t.url}
      target="_blank"
      rel="noreferrer"
      data-focusable
      whileHover={{ y: -6 }}
      className="rounded-2xl border border-line p-5 shadow-card"
      style={{ background: `linear-gradient(160deg, ${t.color}, #0b0b12)` }}
    >
      <div className="u-display text-2xl text-cream">{t.name}</div>
      <div className="mt-1 text-xs text-cream/70">{t.blurb}</div>
      <div className="mt-4 text-sm font-bold text-spray">Launch ↗</div>
    </motion.a>
  );
}
