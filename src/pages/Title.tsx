import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { details, IMG, recommendations, titleOf, watchProviders, yearOf } from "../api/tmdb";
import { fetchDeepLinks, type DeepLinks } from "../api/deeplink";
import { isSaved, toggleSave, useFavorites } from "../lib/favorites";
import type { MediaType, TitleDetails, WatchProviders } from "../lib/types";
import Row from "../components/Row";
import WhereToWatch from "../components/WhereToWatch";
import Button, { AnchorButton } from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";

export default function Title() {
  const { media, id } = useParams<{ media: MediaType; id: string }>();
  const numId = Number(id);
  const [data, setData] = useState<TitleDetails | null>(null);
  const [wp, setWp] = useState<WatchProviders | null>(null);
  const [deepLinks, setDeepLinks] = useState<DeepLinks>({});
  useFavorites(); // re-render on save changes

  useEffect(() => {
    if (!media || !numId) return;
    setData(null);
    setWp(null);
    setDeepLinks({});
    window.scrollTo(0, 0);
    let alive = true;
    details(media, numId)
      .then((d) => {
        if (!alive) return;
        setData(d);
        // Resolve exact per-title deep links (Hulu/Prime/Disney/…) once we know the
        // precise title + year, so "Play on X" opens the exact title, not a search.
        fetchDeepLinks(media, numId, titleOf(d), yearOf(d)).then((l) => alive && setDeepLinks(l));
      })
      .catch(() => {});
    watchProviders(media, numId).then((p) => alive && setWp(p)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [media, numId]);

  if (!media) return null;

  const trailer = data?.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  const name = data ? titleOf(data) : "";
  const savedFav = isSaved(numId, "favorites");
  const savedWatch = isSaved(numId, "watchlist");

  const saveItem = (list: "favorites" | "watchlist") =>
    data && toggleSave({ ...data, media_type: media }, list);

  return (
    <div>
      <div className="relative h-[46vh] min-h-[300px] w-full overflow-hidden">
        {data?.backdrop_path ? (
          <img src={IMG.backdrop(data.backdrop_path, "original")} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
      </div>

      <div className="relative z-10 -mt-40 px-4 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          <img src={IMG.poster(data?.poster_path, "w500")} alt={name} className="frame w-40 shrink-0 sm:w-56" />

          <div className="flex-1">
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="u-display text-5xl text-cream sm:text-6xl">
              {name}
            </motion.h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-cream/70">
              {data && <span>{yearOf(data)}</span>}
              {data?.vote_average ? <span className="text-spray">★ {data.vote_average.toFixed(1)}</span> : null}
              {data?.runtime ? <span>{data.runtime} min</span> : null}
              {data?.number_of_seasons ? <span>{data.number_of_seasons} seasons</span> : null}
              {data?.genres?.slice(0, 3).map((g) => (
                <span key={g.id} className="rounded-full bg-white/5 px-2 py-0.5">{g.name}</span>
              ))}
            </div>

            <p className="mt-4 max-w-2xl text-cream/80">{data?.overview}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              {trailer && (
                <AnchorButton href={`https://www.youtube.com/watch?v=${trailer.key}`} variant="spray">
                  ▶ Trailer
                </AnchorButton>
              )}
              <Button onClick={() => saveItem("favorites")} variant={savedFav ? "spray" : "ghost"}>
                {savedFav ? "♥ In Favorites" : "♡ Favorite"}
              </Button>
              <Button onClick={() => saveItem("watchlist")} variant={savedWatch ? "spray" : "ghost"}>
                {savedWatch ? "✓ On Watchlist" : "+ Watchlist"}
              </Button>
            </div>
          </div>
        </div>

        <WhereToWatch wp={wp} title={name} deepLinks={deepLinks} />
      </div>

      {data && (
        <div className="mt-10">
          <Row title="More Like This" emoji="🎯" load={() => recommendations(media, numId)} />
        </div>
      )}
    </div>
  );
}
