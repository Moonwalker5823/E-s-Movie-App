import { motion } from "framer-motion";

export interface Tile {
  name: string;
  url: string;
  blurb: string;
  color: string;
  /** Full-bleed artwork. Playlist covers, service promo art — whatever reads from the
   *  couch. Optional: anything without art falls back to the branded panel below, which
   *  is designed to stand on its own rather than look like a missing image. */
  img?: string;
  /** Glyph shown large and faint behind the fallback panel. */
  mark?: string;
}

/** Big launch card that opens an external app/site (Music, Live TV, Games, X).
 *
 *  These used to be flat gradient rectangles with a "Launch ↗" text link — the same
 *  slab repeated six times, telling you nothing at a glance. Now the artwork IS the
 *  tile: cover art fills it, a scrim keeps the title readable over any image, and the
 *  whole card is the target instead of a small link inside it. */
export default function LaunchTile({ t }: { t: Tile }) {
  return (
    <motion.a
      href={t.url}
      target="_blank"
      rel="noreferrer"
      data-focusable
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative block aspect-video overflow-hidden rounded-2xl border border-line shadow-card"
      style={{ background: `linear-gradient(150deg, ${t.color}, #080808)` }}
      aria-label={`${t.name} — ${t.blurb}`}
    >
      {t.img ? (
        <img
          src={t.img}
          alt=""
          loading="lazy"
          /* Art is hidden rather than left as a broken-image glyph — the branded
             gradient underneath is already a complete design. */
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 group-focus-visible:scale-105"
        />
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-5 select-none text-[7rem] leading-none opacity-15 transition-transform duration-500 group-hover:scale-110"
        >
          {t.mark || "▶"}
        </span>
      )}

      {/* Scrim: enough contrast for white type over bright cover art, invisible over dark. */}
      <span className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-black/5" />

      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block truncate font-display text-2xl leading-none tracking-wide text-cream sm:text-[1.75rem]">
          {t.name}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-cream/70">{t.blurb}</span>
          <span className="shrink-0 text-sm font-bold text-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            ↗
          </span>
        </span>
        {/* Gold rule that wipes in on hover/focus — the "this is selected" cue that the
            old card only had via a tiny red text link. */}
        <span className="mt-2 block h-[3px] w-0 rounded-full bg-gold transition-all duration-300 group-hover:w-14 group-focus-visible:w-14" />
      </span>
    </motion.a>
  );
}
