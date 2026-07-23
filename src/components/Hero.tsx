import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IMG, titleOf, trending, yearOf } from "../api/tmdb";
import { LinkButton } from "./ui/Button";
import type { TmdbItem } from "../lib/types";

/** Auto-rotating spotlight of today's trending titles. */
export default function Hero() {
  const [items, setItems] = useState<TmdbItem[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    trending("day")
      .then((r) => setItems(r.filter((i) => i.backdrop_path).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return <div className="shimmer h-[56vh] min-h-[380px] w-full" />;

  const item = items[idx];
  const media = item.media_type || "movie";

  return (
    <div className="relative h-[56vh] min-h-[380px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={item.id}
          src={IMG.backdrop(item.backdrop_path, "original")}
          alt={titleOf(item)}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/20 to-transparent" />

      <motion.div
        key={`c-${item.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="absolute bottom-0 left-0 max-w-2xl p-6 sm:p-10"
      >
        <div className="u-label mb-2 flex items-center gap-3">
          <span className="text-spray">♛ Spotlight</span>
          <span className="text-cream/50">{media === "tv" ? "Series" : "Movie"} · {yearOf(item)}</span>
          {item.vote_average ? <span className="text-spray">★ {item.vote_average.toFixed(1)}</span> : null}
        </div>
        <h1 className="u-display text-5xl text-cream sm:text-7xl">{titleOf(item)}</h1>
        <p className="mt-3 line-clamp-3 text-sm text-cream/70 sm:text-base">{item.overview}</p>
        <div className="mt-5">
          <LinkButton to={`/title/${media}/${item.id}`} variant="spray">
            ▶ Watch options
          </LinkButton>
        </div>
        <div className="mt-5 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-spray" : "w-3 bg-white/30"}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
