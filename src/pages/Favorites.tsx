import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Heading from "../components/ui/Heading";
import { useFavorites, toggleSave } from "../lib/favorites";
import { IMG } from "../api/tmdb";
import { useAvailability } from "../lib/availability";
import { serviceByKey } from "../lib/services";
import { useSettings } from "../lib/settings";
import type { FavoriteItem, MediaType } from "../lib/types";

// Small "on Hulu / Prime / Tubi" badges — shows which of YOUR services carry
// this title (from TMDB watch-provider data).
function ServiceBadges({ media, id }: { media: MediaType; id: number }) {
  const { myServices } = useSettings();
  const on = useAvailability(media, id);
  if (on === null) return <div className="mt-1 h-4" />; // reserve space while loading
  const mine = myServices.filter((k) => on.includes(k));
  if (mine.length === 0) return <div className="mt-1 h-4" />;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {mine.map((k) => {
        const svc = serviceByKey(k);
        if (!svc) return null;
        return (
          <span
            key={k}
            title={`On ${svc.name}`}
            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-ink"
            style={{ background: svc.color }}
          >
            {svc.name}
          </span>
        );
      })}
    </div>
  );
}

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
              data-focusable
              className="text-cream/40 transition hover:text-spray"
              aria-label="remove"
            >
              ✕
            </button>
          </div>
          <ServiceBadges media={f.media_type} id={f.id} />
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
