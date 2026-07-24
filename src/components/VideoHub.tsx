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

// Fisher–Yates shuffle (fresh copy). We randomize the play order on every visit so a
// stale/cached feed never streams the same clips in the same order.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Single-video embed — used by the fullscreen overlay (native controls, sound on).
function embedUrl(id: string, opts: { mute: boolean; controls: boolean }): string {
  const p = new URLSearchParams({
    autoplay: "1",
    mute: opts.mute ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    controls: opts.controls ? "1" : "0",
    cc_load_policy: "0", // captions off by default; native CC button toggles them
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

// Load the YouTube IFrame Player API once (module singleton). We drive the main
// viewer through this real API — NOT the embed `playlist=` URL param, which plays
// the wrong clip (it ignores the path video). `playVideoAt(i)` plays the EXACT clip.
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      resolve(w.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

/**
 * A YouTube video hub. With `autoplay`, a MAIN VIEWER sits at the top and streams
 * the day's clips back-to-back in a shuffled order (via the YouTube Player API, so
 * the clip you pick is the clip that plays), with ⏮/⏭ controls and two "up next"
 * thumbnails. Picking a tile loads it in the viewer (not straight to fullscreen); a
 * Fullscreen button blows up the current clip. Powers Sports / Blerd / Lounge / etc.
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
  const [order, setOrder] = useState<Video[]>([]); // shuffled play order (the viewer's playlist)
  const [current, setCurrent] = useState(0); // index in `order` currently playing
  const [error, setError] = useState(false);
  const [fullVid, setFullVid] = useState<Video | null>(null);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(false); // players default to SOUND ON
  const [cc, setCc] = useState(false); // captions OFF by default
  const closeRef = useRef<HTMLButtonElement>(null);
  const hostRef = useRef<HTMLDivElement>(null); // YT injects its iframe into a child of this
  const playerRef = useRef<any>(null);
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const heroPlayerRef = useRef<HTMLDivElement>(null); // the player box, centered on select

  const len = order.length;
  const feat = autoplay && len ? order[current % len] : null;
  const previews = len ? [order[(current + 1) % len], order[(current + 2) % len]] : [];

  // Build/tear down the API player whenever the feed (order) changes.
  useEffect(() => {
    if (!autoplay || !order.length) return;
    let killed = false;
    const ids = order.map((v) => v.videoId).slice(0, 200);
    loadYouTubeApi().then((YT) => {
      if (killed || !hostRef.current) return;
      hostRef.current.innerHTML = "";
      const el = document.createElement("div"); // YT replaces this node with its iframe
      hostRef.current.appendChild(el);
      playerRef.current = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        videoId: ids[0],
        playerVars: { autoplay: 1, mute: 0, rel: 0, playsinline: 1, modestbranding: 1, controls: 0, cc_load_policy: 0 },
        events: {
          onReady: (e: any) => {
            if (killed) return;
            try {
              e.target.loadPlaylist(ids, 0); // the whole shuffled queue, start at 0
              e.target.setLoop(true); // channel never ends
            } catch {
              /* ignore */
            }
          },
          onStateChange: (e: any) => {
            // Keep the title/up-next in sync with what's ACTUALLY playing (also as it
            // auto-advances), so the label can never disagree with the video.
            try {
              const i = e.target.getPlaylistIndex();
              if (typeof i === "number" && i >= 0) setCurrent(i);
            } catch {
              /* ignore */
            }
          },
        },
      });
    });
    return () => {
      killed = true;
      try {
        playerRef.current && playerRef.current.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [autoplay, order]);

  // Pause the viewer while the fullscreen overlay is up (no double audio); resume after.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (full) p.pauseVideo();
      else p.playVideo();
    } catch {
      /* ignore */
    }
  }, [full]);

  function toggleMute() {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) {
        p.unMute();
        setMuted(false);
      } else {
        p.mute();
        setMuted(true);
      }
    } catch {
      /* ignore */
    }
  }

  // Best-effort caption toggle via the player API (captions may be baked into some
  // clips, which no API can remove; default is off).
  function toggleCc() {
    const p = playerRef.current;
    const next = !cc;
    setCc(next);
    try {
      if (next) {
        p.loadModule("captions");
        p.loadModule("cc");
        p.setOption("captions", "track", { languageCode: "en" });
        p.setOption("cc", "track", { languageCode: "en" });
      } else {
        p.setOption("captions", "track", {});
        p.setOption("cc", "track", {});
      }
    } catch {
      /* ignore */
    }
  }

  function playPrev() {
    const p = playerRef.current;
    if (!p || !len) return;
    try {
      p.previousVideo();
    } catch {
      /* ignore */
    }
    setCurrent((c) => (c - 1 + len) % len);
  }

  function playNext() {
    const p = playerRef.current;
    if (!p || !len) return;
    try {
      p.nextVideo();
    } catch {
      /* ignore */
    }
    setCurrent((c) => (c + 1) % len);
  }

  useEffect(() => {
    setItems(null);
    setOrder([]);
    setCurrent(0);
    setError(false);
    setFull(false);
    setFullVid(null);
    setMuted(false);
    setCc(false);
    let alive = true;
    videos(tab, { short })
      .then((v) => {
        if (!alive) return;
        setItems(v);
        setOrder(autoplay ? shuffle(v) : []);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [tab, short, autoplay]);

  // Load a picked clip into the MAIN VIEWER (not fullscreen) and center it on screen.
  function playInHero(v: Video) {
    const idx = order.findIndex((o) => o.videoId === v.videoId);
    const p = playerRef.current;
    if (idx >= 0) {
      try {
        p && p.playVideoAt(idx); // EXACT clip — the whole point of using the API
      } catch {
        /* ignore */
      }
      setCurrent(idx);
    }
    (heroPlayerRef.current ?? heroWrapRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

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
    if (window.history.state?.hubFull) window.history.back();
    else setFull(false);
  }

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

  const ctrlCls =
    "z-20 grid h-9 w-9 scroll-mt-24 place-items-center rounded-full bg-black/70 text-cream transition hover:bg-black/90";

  return (
    <div>
      {/* MAIN VIEWER — the API-driven player. Stays mounted (even under fullscreen) so
          the player instance survives; picking a tile plays that EXACT clip here. */}
      {autoplay && (
        <div ref={heroWrapRef} className={`mx-auto mb-5 w-full max-w-5xl ${full ? "pointer-events-none" : ""}`}>
          {items === null ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Skeleton className="aspect-video rounded-2xl lg:col-span-2" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-xl" />
              </div>
            </div>
          ) : feat ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div
                  ref={heroPlayerRef}
                  className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-card scroll-mt-24"
                >
                  <div ref={hostRef} className="absolute inset-0 h-full w-full [&>iframe]:pointer-events-none" />
                  <button onClick={toggleMute} data-focusable aria-label={muted ? "Unmute" : "Mute"} className={`absolute left-2 top-2 text-base ${ctrlCls}`}>
                    {muted ? "🔇" : "🔊"}
                  </button>
                  <button
                    onClick={toggleCc}
                    data-focusable
                    aria-label={cc ? "Hide captions" : "Show captions"}
                    className={`absolute left-12 top-2 z-20 grid h-9 min-w-[2.5rem] scroll-mt-24 place-items-center rounded-full px-2 text-[11px] font-extrabold tracking-wide text-cream transition hover:brightness-110 ${cc ? "bg-spray" : "bg-black/70 opacity-70"}`}
                  >
                    CC
                  </button>
                  <button onClick={playPrev} data-focusable aria-label="Previous clip" className={`absolute bottom-2 left-2 text-sm ${ctrlCls}`}>
                    ⏮
                  </button>
                  <button onClick={playNext} data-focusable aria-label="Next clip" className={`absolute bottom-2 left-14 text-sm ${ctrlCls}`}>
                    ⏭
                  </button>
                  <button
                    onClick={() => feat && openFull(feat)}
                    data-focusable
                    data-autofocus
                    aria-label={`Watch ${feat.title} full screen`}
                    className="absolute bottom-2 right-2 z-20 flex scroll-mt-24 items-center gap-1 rounded bg-spray px-2.5 py-1 text-[11px] font-bold text-cream shadow-piece transition hover:brightness-110"
                  >
                    ⛶ Fullscreen
                  </button>
                </div>
                <div className="mt-1.5 line-clamp-1 text-sm font-semibold text-cream">{feat.title}</div>
                <div className="text-xs text-cream/40">{feat.channel} · ⏮ ⏭ skip · 🔊 mute · ⛶ full screen</div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {previews.map((v) => (
                  <button
                    key={v.videoId}
                    onClick={() => playInHero(v)}
                    data-focusable
                    aria-label={`Play ${v.title} in the viewer`}
                    className="group block scroll-mt-24 text-left"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-surface2 shadow-card">
                      <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream/80">Up next</span>
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">▶ Play</span>
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs font-semibold text-cream">{v.title}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tabs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
      )}

      {/* Full-screen overlay player (single video, native controls). data-focus-trap
          keeps the D-pad inside it (see useSpatialNav) so focus can't escape. */}
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
            <button
              key={v.videoId}
              onClick={() => (autoplay ? playInHero(v) : openFull(v))}
              data-focusable
              className="group block text-left"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-surface2 shadow-card">
                <img src={v.thumb} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">▶ {autoplay ? "Play here" : "Play"}</span>
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
