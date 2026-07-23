import { useEffect, useRef, useState } from "react";
import Chip from "./ui/Chip";
import Skeleton from "./ui/Skeleton";
import { videos, type Video } from "../api/videos";

export interface HubTab {
  key: string;
  label: string;
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!t) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [unit, label] of units) if (s >= unit) return `${Math.floor(s / unit)}${label} ago`;
  return "just now";
}

// Players default to SOUND ON. The mini has no chrome (a custom mute toggle drives
// it via the iframe JS API); the fullscreen player uses YouTube's native controls.
// (Unmuted autoplay works in the native TV app; browsers may still gate it.)
function embedUrl(id: string, opts: { mute: boolean; controls: boolean; jsapi?: boolean }): string {
  const p = new URLSearchParams({
    autoplay: "1",
    mute: opts.mute ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    controls: opts.controls ? "1" : "0",
  });
  if (opts.jsapi) p.set("enablejsapi", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

/**
 * A YouTube video hub. With `autoplay`, the newest clip auto-plays in a muted
 * mini window; clicking the mini (or any card) expands to a full-screen player
 * with sound. Powers the Sports "Highlights" hub and Smokers Lounge "Bud TV".
 */
export default function VideoHub({
  tabs,
  defaultKey,
  autoplay = false,
  short = false,
}: {
  tabs: HubTab[];
  defaultKey?: string;
  autoplay?: boolean;
  short?: boolean;
}) {
  const [tab, setTab] = useState(defaultKey || tabs[0].key);
  const [items, setItems] = useState<Video[] | null>(null);
  const [error, setError] = useState(false);
  const [fullVid, setFullVid] = useState<Video | null>(null);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(false); // players default to SOUND ON
  const closeRef = useRef<HTMLButtonElement>(null);
  const miniRef = useRef<HTMLIFrameElement>(null);

  // Toggle the mini player's sound via the YouTube iframe API (no reload).
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    miniRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }),
      "*"
    );
  }

  // The mini "channel" = newest clip, when autoplay is on.
  const channel = autoplay && items && items.length ? items[0] : null;

  useEffect(() => {
    setItems(null);
    setError(false);
    setFull(false);
    setFullVid(null);
    setMuted(false);
    let alive = true;
    videos(tab, { short })
      .then((v) => alive && setItems(v))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [tab, short]);

  function openFull(v: Video) {
    setFullVid(v);
    setFull(true);
    try {
      window.history.pushState({ hubFull: true }, "");
    } catch {
      /* history unavailable — Close/Esc still work */
    }
  }

  function closeFull() {
    if (window.history.state?.hubFull) window.history.back(); // fires popstate → setFull(false)
    else setFull(false);
  }

  // While fullscreen: Back button (TV remote / browser) and Escape close the
  // overlay instead of leaving the page; focus the Close button for the remote.
  useEffect(() => {
    if (!full) return;
    const onPop = () => setFull(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFull();
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const id = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      clearTimeout(id);
    };
  }, [full]);

  return (
    <div>
      {tabs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
      )}

      {/* Mini "channel" window — auto-plays with SOUND ON; click to go full screen. */}
      {channel && !full && (
        <div className="mb-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-card sm:w-[30rem]">
            <iframe
              ref={miniRef}
              key={channel.videoId}
              src={embedUrl(channel.videoId, { mute: false, controls: false, jsapi: true })}
              title={channel.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {/* Mute toggle (sits above the fullscreen layer). */}
            <button
              onClick={toggleMute}
              data-focusable
              aria-label={muted ? "Unmute" : "Mute"}
              className="absolute left-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-sm text-cream transition hover:bg-black/90"
            >
              {muted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => openFull(channel)}
              data-focusable
              aria-label="Play full screen"
              className="absolute inset-0 z-10 flex items-end justify-between bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 text-left transition hover:from-black/50"
            >
              <span className="rounded bg-black/70 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                ▶ Now Playing
              </span>
              <span className="rounded bg-spray px-2 py-1 text-[11px] font-bold text-cream shadow-piece">⛶ Fullscreen</span>
            </button>
          </div>
          <div className="mt-1.5 line-clamp-1 text-sm font-semibold text-cream">{channel.title}</div>
          <div className="text-xs text-cream/40">
            {channel.channel} · sound on — tap 🔊 to mute, or ⛶ for full screen
          </div>
        </div>
      )}

      {/* Full-screen overlay player (unmuted, full controls). data-focus-trap keeps
          the D-pad inside it (see useSpatialNav) so focus can't escape to the nav. */}
      {full && fullVid && (
        <div data-focus-trap className="fixed inset-0 z-[60] flex flex-col bg-black">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 truncate font-semibold text-cream">{fullVid.title}</div>
            <button ref={closeRef} onClick={closeFull} data-focusable className="btn-ghost shrink-0 !px-3 !py-1 text-sm">
              Close ✕
            </button>
          </div>
          <div className="relative flex-1">
            <iframe
              key={"full-" + fullVid.videoId}
              src={embedUrl(fullVid.videoId, { mute: false, controls: true })}
              title={fullVid.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}

      {error ? (
        <p className="text-cream/60">
          Videos load on the deployed site (they use the built-in video service). Redeploy to Vercel —
          or run <code className="font-mono">vercel dev</code> locally — to see them here.
        </p>
      ) : items === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-cream/60">No clips right now — check back tonight.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((v) => (
            <button key={v.videoId} onClick={() => openFull(v)} data-focusable className="group block text-left">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-surface2 shadow-card">
                <img
                  src={v.thumb}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                  ▶ Play
                </span>
              </div>
              <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-cream">{v.title}</div>
              <div className="text-xs text-cream/40">
                {v.channel}
                {v.published ? ` · ${timeAgo(v.published)}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
