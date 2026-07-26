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

// This app runs primarily on a big-screen TV, so always request the best available
// resolution. YouTube ultimately auto-selects by player size + bandwidth (a full-screen
// TV player already favors HD), but "highres" asks for the max and gracefully falls back
// to the highest level a given clip actually has. Re-applied as each clip starts, since
// the player can reset to "auto" when a playlist advances.
const HD_QUALITY = "highres";
function forceHd(target: any) {
  try {
    target?.setPlaybackQuality?.(HD_QUALITY);
  } catch {
    /* deprecated / no-op on newer players — harmless */
  }
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

// A small "up next" preview tile shown on each side of the main viewer.
function UpNextTile({ v, onPlay }: { v: Video; onPlay: (v: Video) => void }) {
  return (
    <button
      onClick={() => onPlay(v)}
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
  );
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
  daily = false,
  freshHours,
  cinema = false,
  rail,
}: {
  tabs: HubTab[];
  defaultKey?: string;
  autoplay?: boolean;
  short?: boolean;
  daily?: boolean; // fresh daily rotation (server orders it by date; keep that order)
  freshHours?: number; // rotate every N hours instead of daily (Sports = 3); server-ordered
  cinema?: boolean; // The Mix: one big compilation player — no up-next tiles or browse grid
  rail?: React.ReactNode; // optional side panel (e.g. live scores) shown beside the viewer
}) {
  const [tab, setTab] = useState(defaultKey || tabs[0].key);
  const [items, setItems] = useState<Video[] | null>(null);
  const [order, setOrder] = useState<Video[]>([]); // shuffled play order (the viewer's playlist)
  const [current, setCurrent] = useState(0); // index in `order` currently playing
  const [error, setError] = useState(false);
  const [errMissing, setErrMissing] = useState(false); // 404 = no /api (local dev) vs a transient error
  const [fullVid, setFullVid] = useState<Video | null>(null);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(false); // players default to SOUND ON
  const [cc, setCc] = useState(false); // captions OFF by default
  const [playing, setPlaying] = useState(true); // autoplay starts playing
  const [fsPlaying, setFsPlaying] = useState(true); // fullscreen player play state
  const [fsMuted, setFsMuted] = useState(false);
  const [fsIndex, setFsIndex] = useState(0); // fullscreen playlist index (drives the title)
  const [showControls, setShowControls] = useState(true); // auto-hide player controls when idle
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null); // refocus target when fullscreen closes
  const controlsTimer = useRef<number>();
  const hostRef = useRef<HTMLDivElement>(null); // YT injects its iframe into a child of this
  const playerRef = useRef<any>(null);
  const playingRef = useRef(true); // user's intended play state (survives fullscreen)
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const heroPlayerRef = useRef<HTMLDivElement>(null); // the player box, centered on select
  const fullHostRef = useRef<HTMLDivElement>(null); // fullscreen player mount
  const fullPlayerRef = useRef<any>(null);
  const fsStartRef = useRef(0); // main viewer's time when fullscreen opened → fullscreen opens here
  const fsSoughtRef = useRef(false); // have we applied fsStartRef to the fullscreen player yet?
  const resumeRef = useRef<{ index: number; time: number } | null>(null); // where fullscreen left off
  const mainSeekRef = useRef<number | null>(null); // pending main-player seek after a clip switch

  const len = order.length;
  const feat = autoplay && len ? order[current % len] : null;
  const previews = len ? [order[(current + 1) % len], order[(current + 2) % len]] : [];
  // For the rail layout, the "up next" tiles move into a row BELOW the viewer — show a
  // few unique upcoming clips (skip the one currently playing).
  const belowPreviews: Video[] = [];
  if (len) {
    const seen = new Set<string | undefined>([feat?.videoId]);
    for (let k = 1; k <= len && belowPreviews.length < 3; k++) {
      const v = order[(current + k) % len];
      if (v && !seen.has(v.videoId)) {
        seen.add(v.videoId);
        belowPreviews.push(v);
      }
    }
  }

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
              e.target.loadPlaylist(ids, 0, 0, HD_QUALITY); // whole shuffled queue from 0, best quality
              e.target.setLoop(true); // channel never ends
              forceHd(e.target);
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
            // Keep the play/pause button in sync (1 = playing, 2 = paused; ignore
            // buffering/cued so the icon doesn't flicker mid-load).
            if (e.data === 1) {
              setPlaying(true);
              playingRef.current = true;
              forceHd(e.target); // re-request max quality as each clip in the reel starts
              // If we just switched clips to resume where fullscreen left off, seek once
              // the new clip actually starts (a seek issued mid-load is dropped).
              if (mainSeekRef.current != null) {
                const target = mainSeekRef.current;
                mainSeekRef.current = null;
                try {
                  e.target.seekTo(target, true);
                } catch {
                  /* ignore */
                }
              }
            } else if (e.data === 2) {
              setPlaying(false);
              playingRef.current = false;
            } else if (e.data === 0) {
              try {
                e.target.nextVideo(); // ended → advance (loadPlaylist auto-advance is unreliable)
              } catch {
                /* ignore */
              }
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

  // Pause the viewer while the fullscreen overlay is up (no double audio). On CLOSE,
  // resume it exactly where fullscreen left off — same clip + timestamp — instead of
  // jumping back to where it was when fullscreen opened.
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (full) {
        p.pauseVideo();
        return;
      }
      const r = resumeRef.current;
      resumeRef.current = null;
      if (r) {
        let curIdx = -1;
        try {
          curIdx = p.getPlaylistIndex ? p.getPlaylistIndex() : -1;
        } catch {
          /* ignore */
        }
        if (r.index >= 0 && r.index !== curIdx) {
          mainSeekRef.current = r.time > 1 ? r.time : null; // seek once the new clip plays
          p.playVideoAt(r.index);
          setCurrent(r.index);
        } else if (r.time > 1) {
          p.seekTo(r.time, true); // same clip already loaded — seek right away
        }
      }
      if (playingRef.current) p.playVideo(); // don't override a deliberate pause
    } catch {
      /* ignore */
    }
  }, [full]);

  // Fullscreen player — its own API instance so the TV remote can drive it via our
  // focusable buttons (the native YouTube controls can't be reached by the D-pad).
  useEffect(() => {
    if (!full || !fullVid) return;
    let killed = false;
    setFsPlaying(true);
    setFsMuted(false);
    fsSoughtRef.current = false; // re-seek to the viewer's spot each time we open
    // Fullscreen CONTINUES the reel: load the same shuffled queue, starting on the
    // picked clip, so it auto-advances to the next video (and loops) instead of
    // stopping after one.
    const ids = order.length ? order.map((v) => v.videoId) : [fullVid.videoId];
    const start = Math.max(0, ids.indexOf(fullVid.videoId));
    setFsIndex(start);
    loadYouTubeApi().then((YT) => {
      if (killed || !fullHostRef.current) return;
      fullHostRef.current.innerHTML = "";
      const el = document.createElement("div");
      fullHostRef.current.appendChild(el);
      fullPlayerRef.current = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        videoId: fullVid.videoId,
        playerVars: { autoplay: 1, mute: 0, rel: 0, playsinline: 1, modestbranding: 1, controls: 0, cc_load_policy: 0 },
        events: {
          onReady: (e: any) => {
            if (killed) return;
            try {
              if (ids.length > 1) {
                e.target.loadPlaylist(ids, start, 0, HD_QUALITY); // start here at best quality, then auto-advance
                e.target.setLoop(true); // the reel never ends
              }
              forceHd(e.target);
            } catch {
              /* ignore */
            }
          },
          onStateChange: (e: any) => {
            try {
              const i = e.target.getPlaylistIndex();
              if (typeof i === "number" && i >= 0) setFsIndex(i); // keep the title on the current clip
            } catch {
              /* ignore */
            }
            if (e.data === 1) {
              setFsPlaying(true);
              forceHd(e.target); // re-request max quality as each clip in the reel starts
              // Open at the SAME spot the main viewer was at (seek once, when playback
              // actually begins — a seek issued during load is dropped by the API).
              if (!fsSoughtRef.current) {
                fsSoughtRef.current = true;
                const t = fsStartRef.current || 0;
                if (t > 1) {
                  try {
                    e.target.seekTo(t, true);
                  } catch {
                    /* ignore */
                  }
                }
              }
            } else if (e.data === 2) setFsPlaying(false);
            else if (e.data === 0) {
              try {
                e.target.nextVideo(); // ended → advance to the next clip (reliable)
              } catch {
                /* ignore */
              }
            }
          },
        },
      });
    });
    return () => {
      killed = true;
      // Remember where fullscreen left off (clip + timestamp) BEFORE destroying the
      // player, so the main viewer can resume there on close.
      try {
        const p = fullPlayerRef.current;
        if (p && p.getCurrentTime) {
          let idx = -1;
          try {
            idx = p.getPlaylistIndex ? p.getPlaylistIndex() : -1;
          } catch {
            /* ignore */
          }
          resumeRef.current = { index: idx, time: p.getCurrentTime() || 0 };
        }
      } catch {
        /* ignore */
      }
      try {
        fullPlayerRef.current && fullPlayerRef.current.destroy();
      } catch {
        /* ignore */
      }
      fullPlayerRef.current = null;
    };
  }, [full, fullVid, order]);

  function fsTogglePlay() {
    const p = fullPlayerRef.current;
    if (!p) return;
    try {
      if (fsPlaying) {
        p.pauseVideo();
        setFsPlaying(false);
      } else {
        p.playVideo();
        setFsPlaying(true);
      }
    } catch {
      /* ignore */
    }
  }
  function fsSeek(delta: number) {
    const p = fullPlayerRef.current;
    if (!p) return;
    try {
      const t = (p.getCurrentTime && p.getCurrentTime()) || 0;
      p.seekTo(Math.max(0, t + delta), true);
    } catch {
      /* ignore */
    }
  }
  // Jump whole clips within fullscreen (the reel is a playlist), not just ±10s.
  function fsPrevVideo() {
    const p = fullPlayerRef.current;
    if (!p) return;
    try {
      p.previousVideo();
    } catch {
      /* ignore */
    }
  }
  function fsNextVideo() {
    const p = fullPlayerRef.current;
    if (!p) return;
    try {
      p.nextVideo();
    } catch {
      /* ignore */
    }
  }
  function fsToggleMute() {
    const p = fullPlayerRef.current;
    if (!p) return;
    try {
      if (fsMuted) {
        p.unMute();
        setFsMuted(false);
      } else {
        p.mute();
        setFsMuted(true);
      }
    } catch {
      /* ignore */
    }
  }

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
    if (!p) return; // don't light the CC pill if the player isn't built yet
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

  function togglePlay() {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (playing) {
        p.pauseVideo();
        setPlaying(false);
        playingRef.current = false;
      } else {
        p.playVideo();
        setPlaying(true);
        playingRef.current = true;
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
    setErrMissing(false);
    setFull(false);
    setFullVid(null);
    setMuted(false);
    setCc(false);
    let alive = true;
    videos(tab, { short, daily, hours: freshHours })
      .then((v) => {
        if (!alive) return;
        setItems(v);
        // ALWAYS shuffle the play order per visit so the same clip doesn't greet you
        // every time. `daily`/`freshHours` keep the CONTENT pool fresh day to day (or
        // every N hours); this just varies the ORDER each time you land on the page.
        setOrder(autoplay ? shuffle(v) : []);
      })
      .catch((e) => {
        if (!alive) return;
        setError(true);
        // No /api/videos runtime (plain `vite dev` → 404 or HTML instead of JSON) shows
        // the "runs on the live site" hint; anything else (e.g. a transient 5xx on the
        // live site) is just a temporary hiccup.
        setErrMissing(/\b404\b|non-json/.test(String((e as Error)?.message || "")));
      });
    return () => {
      alive = false;
    };
  }, [tab, short, autoplay, daily, freshHours]);

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
    openerRef.current = document.activeElement as HTMLElement | null; // restore this on close
    // Capture where the main viewer is so fullscreen opens at the SAME spot (not from 0).
    try {
      const p = playerRef.current;
      fsStartRef.current = p && p.getCurrentTime ? p.getCurrentTime() || 0 : 0;
    } catch {
      fsStartRef.current = 0;
    }
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
      // Return focus to whatever opened fullscreen (the overlay's Close button is
      // unmounting, which would otherwise drop focus to <body>).
      const opener = openerRef.current;
      if (opener && opener.isConnected) setTimeout(() => opener.focus(), 40);
    };
  }, [full]);

  // Auto-hide the player controls when the remote/mouse is idle; any activity re-shows
  // them. They stay in the DOM + focusable while faded, so the D-pad can re-summon
  // them (the next key press both reveals and acts).
  function bumpControls() {
    setShowControls(true);
    if (controlsTimer.current) window.clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => setShowControls(false), 3200);
  }
  useEffect(() => {
    bumpControls();
    const on = () => bumpControls();
    window.addEventListener("keydown", on);
    window.addEventListener("pointermove", on);
    return () => {
      window.removeEventListener("keydown", on);
      window.removeEventListener("pointermove", on);
      if (controlsTimer.current) window.clearTimeout(controlsTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctrlCls =
    "z-20 grid h-9 w-9 scroll-mt-24 place-items-center rounded-full bg-black/70 text-cream transition hover:bg-black/90";
  const fadeStyle: React.CSSProperties = { opacity: showControls ? 1 : 0, transition: "opacity 300ms ease" };

  // The main viewer box (player + overlay controls) and its caption — built once here
  // so whichever layout is active (rail vs. flanked-by-up-next) reuses the SAME player.
  const viewer = feat ? (
    <div
      ref={heroPlayerRef}
      className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-card scroll-mt-24"
    >
      <div ref={hostRef} className="absolute inset-0 h-full w-full [&>iframe]:pointer-events-none" />
      <div style={fadeStyle} className="absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">
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
        <button onClick={togglePlay} data-focusable aria-label={playing ? "Pause" : "Play"} className={`absolute bottom-2 left-14 text-base ${ctrlCls}`}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={playNext} data-focusable aria-label="Next clip" className={`absolute bottom-2 left-[6.5rem] text-sm ${ctrlCls}`}>
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
    </div>
  ) : null;

  const meta = feat ? (
    <>
      <div className="mt-1.5 line-clamp-1 text-sm font-semibold text-cream">{feat.title}</div>
      <div className="text-xs text-cream/40">{feat.channel} · ⏸ pause · ⏮ ⏭ skip · 🔊 mute · ⛶ full</div>
    </>
  ) : null;

  return (
    <div>
      {/* MAIN VIEWER — the API-driven player. Stays mounted (even under fullscreen) so
          the player instance survives; picking a tile plays that EXACT clip here. */}
      {autoplay && (
        <div
          ref={heroWrapRef}
          className={`mx-auto mb-5 w-full ${cinema ? "max-w-[min(96rem,168vh)]" : rail ? "max-w-[min(78rem,165vh)]" : "max-w-[min(64rem,150vh)]"} ${full ? "pointer-events-none" : ""}`}
        >
          {items === null ? (
            cinema ? (
              <Skeleton className="aspect-video rounded-2xl" />
            ) : rail ? (
              <div className="grid grid-cols-[minmax(0,1fr)_15rem] items-start gap-4 sm:grid-cols-[minmax(0,1fr)_17rem]">
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="min-h-[16rem] rounded-2xl" />
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_3fr_1fr] items-start gap-3">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="aspect-video rounded-2xl" />
                <Skeleton className="aspect-video rounded-xl" />
              </div>
            )
          ) : feat ? (
            cinema ? (
              // The Mix: one big compilation player — just the reel + controls, no clutter.
              <div>
                {viewer}
                {meta}
              </div>
            ) : rail ? (
              // Sports-style layout: an enlarged viewer with a live scores/stats rail
              // beside it, and the "up next" clips in a row underneath.
              <div className="grid grid-cols-[minmax(0,1fr)_15rem] items-start gap-4 sm:grid-cols-[minmax(0,1fr)_17rem]">
                <div>
                  {viewer}
                  {meta}
                  {belowPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {belowPreviews.map((v) => (
                        <UpNextTile key={v.videoId} v={v} onPlay={playInHero} />
                      ))}
                    </div>
                  )}
                </div>
                <aside className="max-h-[min(82vh,42rem)] overflow-y-auto rounded-2xl border border-line bg-surface2/40 p-3">
                  {rail}
                </aside>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_3fr_1fr] items-start gap-3">
                {previews[0] && <UpNextTile v={previews[0]} onPlay={playInHero} />}
                <div>
                  {viewer}
                  {meta}
                </div>
                {previews[1] && <UpNextTile v={previews[1]} onPlay={playInHero} />}
              </div>
            )
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

      {/* Full-screen overlay player. Video fills the screen; our OWN focusable
          controls overlay it so the TV remote (D-pad) can play/pause/seek/mute —
          the native YouTube controls can't be reached by the D-pad. data-focus-trap
          keeps focus inside the overlay (see useSpatialNav). */}
      {full && fullVid && (
        <div data-focus-trap className="fixed inset-0 z-[60] bg-black">
          <div ref={fullHostRef} className="absolute inset-0 h-full w-full" />

          {/* Top bar: title + close */}
          <div style={fadeStyle} className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
            <div className="min-w-0 truncate font-semibold text-cream">{(order[fsIndex] ?? fullVid).title}</div>
            <button ref={closeRef} onClick={closeFull} data-focusable className="btn-ghost shrink-0 !px-3 !py-1 text-sm">
              Close ✕
            </button>
          </div>

          {/* Bottom controls — remote-navigable. ⏮/⏭ jump whole clips; ⏪/⏩ nudge ±10s. */}
          <div style={fadeStyle} className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2.5 bg-gradient-to-t from-black/80 to-transparent px-4 py-5 sm:gap-3">
            <button onClick={fsPrevVideo} data-focusable aria-label="Previous video" className="btn-ghost !px-4 !py-2">
              ⏮ Prev
            </button>
            <button onClick={() => fsSeek(-10)} data-focusable aria-label="Rewind 10 seconds" className="btn-ghost !px-4 !py-2">
              ⏪ 10s
            </button>
            <button onClick={fsTogglePlay} data-focusable data-autofocus aria-label={fsPlaying ? "Pause" : "Play"} className="btn-spray !px-6 !py-2 text-xl">
              {fsPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={() => fsSeek(10)} data-focusable aria-label="Forward 10 seconds" className="btn-ghost !px-4 !py-2">
              10s ⏩
            </button>
            <button onClick={fsNextVideo} data-focusable aria-label="Next video" className="btn-ghost !px-4 !py-2">
              Next ⏭
            </button>
            <button onClick={fsToggleMute} data-focusable aria-label={fsMuted ? "Unmute" : "Mute"} className="btn-ghost !px-4 !py-2">
              {fsMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>
      )}

      {error ? (
        errMissing ? (
          <p className="text-cream/60">
            Videos load on the deployed site (they use the built-in video service). Redeploy to Vercel —
            or run <code className="font-mono">vercel dev</code> locally — to see them here.
          </p>
        ) : (
          <p className="text-cream/60">Couldn&apos;t load clips right now — give it a moment and try again.</p>
        )
      ) : items === null ? (
        cinema ? null : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-xl" />
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <p className="text-cream/60">No clips right now — check back tonight.</p>
      ) : cinema ? null : (
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
