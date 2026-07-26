import { useEffect, useRef, useState } from "react";
import PosterCard from "../components/PosterCard";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import Pagination from "../components/ui/Pagination";
import Skeleton from "../components/ui/Skeleton";
import { byProvider } from "../api/tmdb";
import { STREAMING_SERVICES, myProviderIds } from "../lib/services";
import { useSettings } from "../lib/settings";
import type { MediaType, TmdbItem } from "../lib/types";

type ServicePick = { name: string; id: number | string; free?: boolean; combo?: boolean };

// The per-service chips come straight from STREAMING_SERVICES (single source of
// truth) — free ones first — plus the "All Free" combo catalog.
const FREE_COMBO = "73|300|207|12|613"; // Tubi, Pluto, Roku, Crackle, Freevee
const SERVICES: ServicePick[] = [
  { name: "🆓 All Free", id: FREE_COMBO, combo: true },
  ...STREAMING_SERVICES.filter((s) => s.tmdbId)
    .map((s) => ({ name: s.name, id: s.tmdbId as number, free: s.free }))
    .sort((a, b) => Number(Boolean(b.free)) - Number(Boolean(a.free))),
];

// How far into a catalog the "surprise me" random landing page can reach. Capped so
// we stay within the pages TMDB actually returns and keep results popular-ish.
const RANDOM_START_CAP = 15;
// TMDB's /discover only serves pages 1–500; asking beyond that 422s. Clamp so the
// pagination control never offers a page the API will refuse.
const clampPages = (n: number) => Math.min(Math.max(n, 1), 500);

export default function Services() {
  const { myServices } = useSettings();
  // "My Services" = one combined catalog of everything you're signed into.
  const myIds = myProviderIds(myServices);
  const services: ServicePick[] = myIds
    ? [{ name: "⭐ My Services", id: myIds, combo: true }, ...SERVICES]
    : SERVICES;

  const [svc, setSvc] = useState<ServicePick>(services[0]);
  const [media, setMedia] = useState<MediaType>("movie");
  const [items, setItems] = useState<TmdbItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false); // land the remote on the first card after a page change

  // Load a specific page, replacing the grid. Best-effort: a failed fetch shows the
  // empty state rather than a stuck skeleton.
  const fetchPage = async (p: number, opts: { focus?: boolean } = {}) => {
    setItems(null);
    const r = await byProvider(media, svc.id, p).catch(() => null);
    setItems(r ? r.items : []);
    setTotalPages(r ? clampPages(r.totalPages) : 1);
    setPage(p);
    if (opts.focus) refocus.current = true;
  };

  // On each visit (and whenever the service / media type changes) land on a RANDOM
  // page of the catalog, so Browse surfaces a fresh slice every time instead of always
  // the same popular page 1. We learn the page count from page 1 first, then jump.
  useEffect(() => {
    let alive = true;
    setItems(null);
    (async () => {
      const first = await byProvider(media, svc.id, 1).catch(() => null);
      if (!alive) return;
      if (!first || first.items.length === 0) {
        setItems(first ? first.items : []);
        setTotalPages(first ? clampPages(first.totalPages) : 1);
        setPage(1);
        return;
      }
      const total = clampPages(first.totalPages);
      const start = total > 1 ? 1 + Math.floor(Math.random() * Math.min(total, RANDOM_START_CAP)) : 1;
      if (start === 1) {
        setItems(first.items);
        setTotalPages(total);
        setPage(1);
        return;
      }
      const r = await byProvider(media, svc.id, start).catch(() => null);
      if (!alive) return;
      setTotalPages(total);
      if (r && r.items.length > 0) {
        setItems(r.items);
        setPage(start);
      } else {
        // Random page came back empty (beyond the real range) — fall back to page 1.
        setItems(first.items);
        setPage(1);
      }
    })();
    return () => {
      alive = false;
    };
  }, [svc, media]);

  const goTo = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    // Jump the view back to the top of the grid so a new page starts at the top.
    gridRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    fetchPage(p, { focus: true });
  };

  // After a page change lands, move the remote's focus to the first card so D-pad
  // navigation continues from the top of the fresh page (not a stale/removed tile).
  useEffect(() => {
    if (!refocus.current || !gridRef.current || !items || items.length === 0) return;
    refocus.current = false;
    const first = gridRef.current.querySelector<HTMLElement>("a[data-focusable]");
    first?.focus({ preventScroll: true });
  }, [items]);

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
        {services.map((s) => (
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
          <div ref={gridRef} className="mt-6 flex scroll-mt-24 flex-wrap gap-4">
            {items.map((i) => (
              <PosterCard key={`${i.media_type}-${i.id}`} item={i} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goTo} />
        </>
      )}
    </div>
  );
}
