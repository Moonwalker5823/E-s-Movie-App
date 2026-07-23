import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Heading from "../components/ui/Heading";
import { useFavorites, toggleSave } from "../lib/favorites";
import { IMG } from "../api/tmdb";
import type { FavoriteItem } from "../lib/types";

function Grid({ items, list }: { items: FavoriteItem[]; list: "favorites" | "watchlist" }) {
  if (items.length === 0) {
    return (
      <p className="mt-3 text-cream/50">
        Nothing here yet. Tap {list === "favorites" ? "♥ Favorite" : "+ Watchlist"} on any title.
      </p>
    );
  }
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {items.map((f) => (
        <motion.div key={`${f.media_type}-${f.id}`} whileHover={{ y: -6 }} className="w-[9.5rem] sm:w-[10.5rem]">
          <Link
            to={`/title/${f.media_type}/${f.id}`}
            data-focusable
            className="block overflow-hidden rounded-xl border border-line shadow-card"
          >
            <div className="aspect-[2/3] bg-surface2">
              {f.poster_path ? (
                <img src={IMG.poster(f.poster_path, "w500")} alt={f.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center p-2 text-center text-xs text-cream/40">
                  {f.title}
                </div>
              )}
            </div>
          </Link>
          <div className="mt-2 flex items-center justify-between gap-1">
            <span className="truncate text-sm font-semibold">{f.title}</span>
            <button
              onClick={() =>
                toggleSave({ id: f.id, media_type: f.media_type, title: f.title, poster_path: f.poster_path }, list)
              }
              className="text-cream/40 transition hover:text-spray"
              aria-label="remove"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Favorites() {
  const all = useFavorites();
  const favorites = all.filter((f) => f.list === "favorites");
  const watchlist = all.filter((f) => f.list === "watchlist");

  return (
    <div className="px-4 py-6 sm:px-8">
      <section>
        <Heading label="♛ My List" emoji="♥" size="xl">
          Favorites
        </Heading>
        <Grid items={favorites} list="favorites" />
      </section>
      <section className="mt-10">
        <Heading emoji="✓" size="xl">
          Watchlist
        </Heading>
        <Grid items={watchlist} list="watchlist" />
      </section>
    </div>
  );
}
