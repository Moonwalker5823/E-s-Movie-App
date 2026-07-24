import { useEffect, useMemo, useRef, useState } from "react";
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

// Fisher–Yates shuffle (returns a fresh copy). We randomize the play order on every
// visit so a stale/cached feed never streams the same clips in the same order.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A single-video embed. Players default to SOUND ON; the hero has no chrome (a
// custom mute toggle drives it via the iframe JS API), the fullscreen player uses
// YouTube's native controls. (Unmuted autoplay works in the native TV app.)
function embedUrl(id: string, opts: { mute: boolean; controls: boolean; jsapi?: boolean }): string {
  const p = new URLSearchParams({
    autoplay: "1",
    mute: opts.mute ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    controls: opts.controls ? "1" : "0",
    cc_load_policy: "0", // captions OFF by default (native CC button still available)
  });
  if (opts.jsapi) p.set("enablejsapi", "1");
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`;
}

// A CONTINUOUS, looping playlist embed: the first id plays, then the REST play in
// order, then it loops back — so the hub streams clips back-to-back like a channel.
// The rest go in `playlist`; if you instead repeat the first id there, YouTube reads
// it as a single-video loop and replays the SAME clip forever (the bug we're fixing).
function embedPlaylistUrl(ids: string[], opts: { mute: boolean; cc: boolean; controls: boolean; jsapi?: boolean }): string {
  const list = ids.slice(0, 30); // cap the URL length
  const rest = list.length > 1 ? list.slice(1) : list; // 1 clip → loop that one
  const p = new URLSearchParams({
    autoplay: "1",
    mute: opts.mute ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    controls: opts.controls ? "1" : "0",
    cc_load_policy: opts.cc ? "1" : "0", // 1 force-loads captions; 0 = viewer default (usually off)
    loop: "1",
    playlist: rest.join(","),
  });
  if (opts.jsapi) p.set("enablejsapi", "1");
  return `https://www.youtube-nocookie.com/embed/${list[0]}?${p.toString()}`;
}

/**
 * A YouTube video hub. With `autoplay`, a MAIN VIEWER sits at the top and streams
 * the day's clips back-to-back in a shuffled order (so a stale feed never repeats),
 * with two "up next" thumbnails. Selecting any tile loads it INTO the main viewer
 * (not straight to fullscreen) and it keeps rolling from there; a Fullscreen button
 * blows up the current clip. Powers Sports / Blerd / Lounge / Games.
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
  const [order, setOrder] = useState<Video[]>([]); // shuffled play order for the viewer
  const [heroStart, setHeroStart] = useState(0); // index in `order` the viewer starts at
  const [error, setError] = useState(false);
  const [fullVid, setFullVid] = useState<Video | null>(null);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(false); // players default to SOUND ON
  const [cc, setCc] = useState(false); // closed captions OFF by default
  const closeRef = useRef<HTMLButtonElement>(null);
  const miniRef = useRef<HTMLIFrameElement>(null);
  const heroWrapRef = useRef<HTMLDivElement>(null);
  const heroPlayerRef = useRef<HTMLDivElement>(null); // the player box, centered on select

  // Toggle the hero's sound via the YouTube iframe API (no reload).
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    miniRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }),
      "*"
    );
  }

  // Captions are driven by the embed URL (cc_load_policy) + a remount — reliable,
  // unlike the iframe API's setOption for captions. Flipping `cc` rebuilds the hero.
  function toggleCc() {
    setCc((v) => !v);
  }

  // The main viewer streams the feed starting at `heroStart`, wrapping around; the
  // two "up next" thumbnails preview what plays next.
  const rotated =
    autoplay && order.length ? [...order.slice(heroStart), ...order.slice(0, heroStart)] : [];
  const feat = rotated[0] ?? null;
  const previews = rotated.slice(1, 3);

  // Build the looping-playlist URL once per (order + start) — NOT on mute toggle,
  // which is postMessage-driven — so the viewer only reloads when you pick a clip.
  const rotatedKey = rotated.map((v) => v.videoId).join(",");
  // Rebuild the viewer URL when the order/start changes OR captions toggle. `muted`
  // is read but intentionally NOT a dep: mute is applied live via postMessage (no
  // reload); each rebuild still captures the current mute + cc state so a remount
  // (picking a clip / toggling CC) keeps sound and captions in sync with the buttons.
  const heroSrc = useMemo(
    () =>
      rotated.length
        ? embedPlaylistUrl(rotated.map((v) => v.videoId), { mute: muted, cc, controls: false, jsapi: true })
        : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotatedKey, cc]
  );

  useEffect(() => {
    setItems(null);
    setOrder([]);
    setHeroStart(0);
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

  // Load a picked clip into the MAIN VIEWER (not fullscreen) and bring it into view.
  function playInHero(v: Video) {
    const idx = order.findIndex((o) => o.videoId === v.videoId);
    if (idx >= 0) setHeroStart(idx);
    // Center the PLAYER on screen so a picked clip is front-and-center (not tucked
    // under the heading) before you choose fullscreen.
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

  return (
    <div>
      {/* MAIN VIEWER — streams clips back-to-back (shuffled). Pick any tile to load it
          here (never straight to fullscreen). data-autofocus lands the remote here. */}
      {autoplay && !full && (
        <div ref={heroWrapRef} className="mb-5 w-full max-w-5xl">
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
                <div ref={heroPlayerRef} className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-card scroll-mt-24">
                  <iframe
                    ref={miniRef}
                    key={`hero-${tab}-${feat.videoId}-${cc ? "cc" : "x"}`}
                    src={heroSrc}
                    title={feat.title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                  />
                  <button
                    onClick={toggleMute}
                    data-focusable
                    aria-label={muted ? "Unmute" : "Mute"}
                    className="absolute left-2 top-2 z-20 grid h-9 w-9 scroll-mt-24 place-items-center rounded-full bg-black/70 text-base text-cream transition hover:bg-black/90"
                  >
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
                  <button
                    onClick={() => openFull(feat)}
                    data-focusable
                    data-autofocus
                    aria-label={`Watch ${feat.title} full screen`}
                    className="absolute bottom-2 right-2 z-20 flex scroll-mt-24 items-center gap-1 rounded bg-spray px-2.5 py-1 text-[11px] font-bold text-cream shadow-piece transition hover:brightness-110"
                  >
                    ⛶ Fullscreen
                  </button>
                </div>
                <div className="mt-1.5 line-clamp-1 text-sm font-semibold text-cream">{feat.title}</div>
                <div className="text-xs text-cream/40">{feat.channel} · streams back-to-back · 🔊 mute · ⛶ full screen</div>
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

      {/* Full-screen overlay player (unmuted, native controls). data-focus-trap keeps
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
