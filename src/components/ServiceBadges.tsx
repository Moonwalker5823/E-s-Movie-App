import { useEffect, useRef, useState } from "react";
import { useAvailability } from "../lib/availability";
import { serviceByKey } from "../lib/services";
import { launchUrlFor } from "../lib/providers";
import { useSettings } from "../lib/settings";
import type { DeepLinks } from "../api/deeplink";
import type { MediaType } from "../lib/types";

interface Props {
  media: MediaType;
  id: number;
  /** Title used to build the launch link. Only used when `clickable` is set. */
  title?: string;
  /** Make the badges tappable to open the title on that service. Reserved for the
   *  detail page — in grids/rails the badges are display-only (you select the movie
   *  first, then launch from its detail page). */
  clickable?: boolean;
  /** Exact per-title deep links (from /api/deeplink) so a clickable badge lands on the
   *  precise title — the SAME link the "Play on X" buttons use, not a search page. */
  deepLinks?: DeepLinks;
  /** Defer the provider lookup until the badges scroll near the viewport — used on the
   *  poster grids so a screen full of posters doesn't fire dozens of lookups at once. */
  lazy?: boolean;
  className?: string;
}

// Small "on Hulu / Prime / Tubi" brand badges — shows which of YOUR services carry
// this title (from TMDB watch-provider data). Shown on every poster card + My List as
// plain labels; only the detail page passes `clickable` so tapping one plays it there.
export default function ServiceBadges({ media, id, title, clickable = false, deepLinks, lazy = false, className = "" }: Props) {
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
        return clickable && title ? (
          <a
            key={k}
            href={launchUrlFor(svc.name, title, deepLinks)}
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
