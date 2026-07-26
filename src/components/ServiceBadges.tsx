import { useEffect, useRef, useState } from "react";
import { useAvailability } from "../lib/availability";
import { serviceByKey } from "../lib/services";
import { launchUrlFor } from "../lib/providers";
import { useSettings } from "../lib/settings";
import type { MediaType } from "../lib/types";

interface Props {
  media: MediaType;
  id: number;
  /** When provided, each badge becomes a clickable link that opens the title on that
   *  service (its own search / deep link, which hands off to the app on the TV). */
  title?: string;
  /** Defer the provider lookup until the badges scroll near the viewport — used on the
   *  poster grids so a screen full of posters doesn't fire dozens of lookups at once. */
  lazy?: boolean;
  className?: string;
}

// Small "on Hulu / Prime / Tubi" brand badges — shows which of YOUR services carry
// this title (from TMDB watch-provider data). Shared by My List, the title page, and
// every poster card. With a `title`, tapping a badge plays it on that service.
export default function ServiceBadges({ media, id, title, lazy = false, className = "" }: Props) {
  const { myServices } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    if (!lazy || visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" } // start loading a bit before the poster is on screen
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, visible]);

  const on = useAvailability(media, id, visible);
  const mine = on ? myServices.filter((k) => on.includes(k)) : [];
  const badgeCls = "rounded px-1.5 py-0.5 text-[10px] font-bold text-ink";

  return (
    // min-height reserves one badge row so cards stay the same height (no grid/rail jank).
    <div ref={ref} className={`flex min-h-[1.05rem] flex-wrap gap-1 ${className}`}>
      {mine.map((k) => {
        const svc = serviceByKey(k);
        if (!svc) return null;
        return title ? (
          <a
            key={k}
            href={launchUrlFor(svc.name, title)}
            target="_blank"
            rel="noreferrer"
            data-focusable
            onClick={(e) => e.stopPropagation()}
            title={`Play ${title} on ${svc.name}`}
            className={`${badgeCls} transition hover:brightness-110`}
            style={{ background: svc.color }}
          >
            {svc.name}
          </a>
        ) : (
          <span key={k} title={`On ${svc.name}`} className={badgeCls} style={{ background: svc.color }}>
            {svc.name}
          </span>
        );
      })}
    </div>
  );
}
