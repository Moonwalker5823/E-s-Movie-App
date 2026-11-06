import { Link } from "react-router-dom";
import { listResume, type ResumeEntry } from "../../lib/resume";

// "Pick up where you left off" across every hub at once. The reels already each
// remembered their own spot, but you had to go to the right page to find out — which
// defeats the point. This surfaces all of them on the home screen, newest first.

const HUB_LABEL: Record<string, string> = {
  "/sports": "Sports",
  "/mix": "The Mix",
  "/music": "Music",
  "/games": "Arcade",
  "/lounge": "Lounge",
  "/blerd": "Blerd",
  "/comedy": "Comedy",
  "/live": "Live TV",
};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Card({ r }: { r: ResumeEntry }) {
  const where = HUB_LABEL[r.path || ""] || "Watching";
  return (
    <Link
      to={r.path || "/"}
      data-focusable
      className="card card-hover group w-64 shrink-0 overflow-hidden"
      title={r.title}
    >
      <div className="relative aspect-video overflow-hidden bg-surface2">
        <img
          src={`https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:brightness-110"
        />
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-cream">
          {mmss(r.seconds)}
        </span>
        {/* A resume point is a position, not a percentage — we never learn the clip's
            total length — so this is a fixed nub that reads as "partially watched"
            rather than a progress bar that would be quietly lying about how far in. */}
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
          <span className="block h-full w-1/3 bg-gold" />
        </span>
      </div>
      <div className="p-2.5">
        <div className="u-label text-[10px]">{where}</div>
        <div className="mt-0.5 line-clamp-2 text-sm leading-snug text-cream/90">{r.title}</div>
      </div>
    </Link>
  );
}

export default function ContinueRow() {
  const items = listResume(8);
  if (items.length === 0) return null; // no empty shelf — the section simply isn't there

  return (
    <section className="section">
      <div className="section-head flex items-baseline gap-3 px-4 sm:px-10">
        <h2 className="u-display text-2xl text-cream sm:text-3xl">Pick Up Where You Left Off</h2>
      </div>
      <div className="rail no-scrollbar">
        {items.map((r) => (
          <Card key={r.tab + r.videoId} r={r} />
        ))}
      </div>
    </section>
  );
}
