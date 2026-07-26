import { useAvailability } from "../lib/availability";
import { serviceByKey } from "../lib/services";
import { useSettings } from "../lib/settings";
import type { MediaType } from "../lib/types";

// Small "on Hulu / Prime / Tubi" brand badges — shows which of YOUR services carry
// this title (from TMDB watch-provider data). Shared by My List and the title page.
export default function ServiceBadges({
  media,
  id,
  className = "",
}: {
  media: MediaType;
  id: number;
  className?: string;
}) {
  const { myServices } = useSettings();
  const on = useAvailability(media, id);
  // Reserve a little vertical space while loading so the layout doesn't jump.
  if (on === null) return <div className={`h-4 ${className}`} />;
  const mine = myServices.filter((k) => on.includes(k));
  if (mine.length === 0) return <div className={`h-4 ${className}`} />;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
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
