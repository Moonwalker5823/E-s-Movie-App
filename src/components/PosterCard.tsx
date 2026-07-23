import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { TmdbItem } from "../lib/types";
import { IMG, titleOf, yearOf } from "../api/tmdb";

/** Poster tile used across every rail and grid. */
export default function PosterCard({ item }: { item: TmdbItem }) {
  const media = item.media_type || (item.title ? "movie" : "tv");
  const img = IMG.poster(item.poster_path);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="w-[9.5rem] shrink-0 sm:w-[10.5rem]"
    >
      <Link
        to={`/title/${media}/${item.id}`}
        data-focusable
        className="block overflow-hidden rounded-xl border border-line bg-surface2 shadow-card"
      >
        <div className="relative aspect-[2/3]">
          {img ? (
            <img src={IMG.poster(item.poster_path, "w500")} alt={titleOf(item)} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-cream/40">
              {titleOf(item)}
            </div>
          )}
          {rating && (
            <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-spray">
              ★ {rating}
            </span>
          )}
          <span className="absolute right-2 top-2 rounded bg-spray/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
            {media}
          </span>
        </div>
      </Link>
      <div className="mt-2 px-0.5">
        <div className="truncate text-sm font-semibold">{titleOf(item)}</div>
        <div className="text-xs text-cream/40">{yearOf(item)}</div>
      </div>
    </motion.div>
  );
}
