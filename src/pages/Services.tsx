import { useEffect, useState } from "react";
import PosterCard from "../components/PosterCard";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import { byProvider } from "../api/tmdb";
import type { MediaType, TmdbItem } from "../lib/types";

// TMDB US watch-provider IDs. "free" = ad-supported, no subscription.
// The first entry merges every free service into one endless catalog.
const FREE_COMBO = "73|300|207|12|613"; // Tubi, Pluto, Roku, Crackle, Freevee
const SERVICES: { name: string; id: number | string; free?: boolean; combo?: boolean }[] = [
  { name: "🆓 All Free", id: FREE_COMBO, combo: true },
  { name: "Tubi", id: 73, free: true },
  { name: "Pluto TV", id: 300, free: true },
  { name: "Hulu", id: 15 },
  { name: "Prime Video", id: 9 },
  { name: "Netflix", id: 8 },
  { name: "Max", id: 1899 },
  { name: "Disney+", id: 337 },
  { name: "Paramount+", id: 531 },
  { name: "Peacock", id: 386 },
  { name: "Apple TV+", id: 350 },
];

export default function Services() {
  const [svc, setSvc] = useState(SERVICES[0]);
  const [media, setMedia] = useState<MediaType>("movie");
  const [items, setItems] = useState<TmdbItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset when the service or media type changes.
  useEffect(() => {
    setItems(null);
    setPage(1);
    let alive = true;
    byProvider(media, svc.id, 1)
      .then((r) => {
        if (!alive) return;
        setItems(r.items);
        setTotalPages(r.totalPages);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [svc, media]);

  const loadMore = async () => {
    setLoadingMore(true);
    const next = page + 1;
    const r = await byProvider(media, svc.id, next).catch(() => null);
    if (r) {
      setItems((prev) => [...(prev || []), ...r.items]);
      setPage(next);
    }
    setLoadingMore(false);
  };

  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Browse by Service" emoji="🎬" size="xl">
        Everything, One Place
      </Heading>
      <p className="mt-2 text-cream/60">
        Scroll a service&apos;s full catalog, then tap a title to launch it. Paid titles play in
        their own app — that&apos;s the only legal way to stream them.
      </p>

      {/* Service picker */}
      <div className="mt-5 flex flex-wrap gap-2">
        {SERVICES.map((s) => (
          <Chip key={s.id} active={svc.id === s.id} onClick={() => setSvc(s)}>
            {s.name}
            {s.free ? " · FREE" : ""}
          </Chip>
        ))}
      </div>

      {/* Movie / TV toggle */}
      <div className="mt-3 flex gap-2">
        {(["movie", "tv"] as MediaType[]).map((m) => (
          <Chip key={m} active={media === m} onClick={() => setMedia(m)}>
            {m === "movie" ? "Movies" : "TV"}
          </Chip>
        ))}
      </div>

      {items === null ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-6 text-cream/60">Nothing listed for {svc.name} right now.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-4">
            {items.map((i) => (
              <PosterCard key={`${i.media_type}-${i.id}`} item={i} />
            ))}
          </div>
          {page < totalPages && (
            <div className="mt-8 flex justify-center">
              <Button onClick={loadMore} variant="spray">
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
