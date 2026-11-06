import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { videos, type Video } from "../../api/videos";

// "What's new" across the hubs, one card each. The home screen used to be movie rails
// only, so the parts of the app actually opened most — Sports, cars, games, music —
// were invisible from it. Each card shows that hub's newest clip and goes straight in.
//
// Six fetches fire in parallel on mount, which sounds like a lot until you notice the
// video API is edge-cached now: they're CDN hits, not six RSS fan-outs.

interface Hub {
  key: string;
  label: string;
  set: string;
  to: string;
  emoji: string;
}

const HUBS: Hub[] = [
  { key: "sports", label: "Sports", set: "all", to: "/sports", emoji: "🏆" },
  { key: "cars", label: "Cars & Racing", set: "motors", to: "/games?tab=motors", emoji: "🏎️" },
  { key: "games", label: "New in Games", set: "gaming", to: "/games", emoji: "🎮" },
  { key: "music", label: "Music", set: "music", to: "/music", emoji: "🎶" },
  { key: "lounge", label: "Lounge", set: "lounge", to: "/lounge", emoji: "🌿" },
  { key: "comedy", label: "Comedy", set: "comedy", to: "/comedy", emoji: "😂" },
];

function HubCard({ hub, video, loading }: { hub: Hub; video: Video | null; loading: boolean }) {
  return (
    <Link to={hub.to} data-focusable className="card card-hover group overflow-hidden">
      <div className="relative aspect-video overflow-hidden bg-surface2">
        {video ? (
          <img
            src={video.thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:brightness-110"
          />
        ) : (
          <div className={`h-full w-full ${loading ? "shimmer" : ""}`} />
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 font-tag text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
          {hub.emoji} {hub.label}
        </span>
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm leading-snug text-cream/90">
          {video?.title || (loading ? "Loading…" : "Open this hub")}
        </div>
        {video?.channel && <div className="mt-1 text-xs text-cream/55">{video.channel}</div>}
      </div>
    </Link>
  );
}

export default function FreshHubs() {
  const [latest, setLatest] = useState<Record<string, Video | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all(
      HUBS.map((h) =>
        videos(h.set, { hours: 12 })
          .then((v) => [h.key, v[0] ?? null] as const)
          .catch(() => [h.key, null] as const)
      )
    ).then((pairs) => {
      if (!alive) return;
      setLatest(Object.fromEntries(pairs));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="section">
      <div className="section-head px-4 sm:px-10">
        <h2 className="u-display text-2xl text-cream sm:text-3xl">Fresh In Your Hubs</h2>
      </div>
      <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
        {HUBS.map((h) => (
          <HubCard key={h.key} hub={h} video={latest[h.key] ?? null} loading={loading} />
        ))}
      </div>
    </section>
  );
}
