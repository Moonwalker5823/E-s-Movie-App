import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { TmdbItem } from "../lib/types";
import { IMG, titleOf, yearOf } from "../api/tmdb";
import ServiceBadges from "./ServiceBadges";
import { useSaved } from "../lib/favorites";

/** Poster tile used across every rail and grid. */
export default function PosterCard({ item }: { item: TmdbItem }) {
  const media = item.media_type || (item.title ? "movie" : "tv");
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  // Show at a glance what's already on your lists: ♥ favorited, ✓ watchlisted.
  const { favorite, watchlist } = useSaved(item.id);

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
          {item.poster_path ? (
            <img src={IMG.poster(item.poster_path, "w500")} alt={titleOf(item)} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-cream/60">
              {titleOf(item)}
            </div>
          )}
          {rating && (
            <span className="absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-spray">
              ★ {rating}
            </span>
          )}
          <span
            className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink ${
              media === "tv" ? "bg-cyan/90" : "bg-spray/90"
            }`}
          >
            {media}
          </span>
          {(favorite || watchlist) && (
            <span
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[12px] font-bold leading-none shadow-card"
              aria-label={favorite && watchlist ? "On your Favorites and Watchlist" : favorite ? "In your Favorites" : "On your Watchlist"}
            >
              {favorite && <span className="text-spray">♥</span>}
              {watchlist && <span className="text-cyan">✓</span>}
            </span>
          )}
        </div>
      </Link>
      <div className="mt-2 px-0.5">
        <div className="truncate text-sm font-semibold">{titleOf(item)}</div>
        <div className="text-xs text-cream/60">{yearOf(item)}</div>
        {/* Brand badges for the services YOU have that carry this — display-only here;
            select the title to launch it from its detail page. */}
        <ServiceBadges media={media} id={item.id} lazy className="mt-1" />
      </div>
    </motion.div>
  );
}
