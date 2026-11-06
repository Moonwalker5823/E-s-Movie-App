import { useState } from "react";
import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";
import LaunchTile, { type Tile } from "../components/LaunchTile";

// Music videos across your tastes — R&B, soul, hip-hop, rock & classics. The reel
// stays fresh as these channels post; Tidal covers your personalized/era library.
const MUSIC_TABS: HubTab[] = [
  { key: "myplaylists", label: "🎧 My Mix" }, // Eric's own YouTube playlists
  { key: "music", label: "✨ Mix" },
  { key: "golden", label: "🔥 Golden Era" },
  { key: "yomtvraps", label: "📼 Yo! MTV Raps" },
  { key: "lyricists", label: "🎤 Lyricists" },
  { key: "battlerap", label: "🥊 Battle Rap" },
  { key: "soul", label: "🎶 R&B / Soul" },
  { key: "classics", label: "👑 Legends" },
  { key: "rock", label: "🎸 Rock" },
  { key: "tinydesk", label: "🎙️ Tiny Desk" },
];

// One tap into your services. TIDAL is where Eric's library actually lives, so his own
// mixes lead rather than the service's front door. Names resolved from each page rather
// than guessed, and `listen.tidal.com` is used throughout — a bare tidal.com link bounces
// through an app-open interstitial that the TV WebView handles badly.
const TIDAL = "https://listen.tidal.com";
const SERVICES: Tile[] = [
  { name: "My Mix 4", url: `${TIDAL}/mix/0029012bb4956898c79c3bce3e0259`, blurb: "Golden era & 2000s gangsta rap", color: "#0b2a3d", mark: "🎧" },
  { name: "Work", url: `${TIDAL}/playlist/0491126f-41db-42e0-b868-d77b5187ca8b`, blurb: "223 tracks — the long one", color: "#0e3550", img: "https://resources.tidal.com/images/7f1500d2/e52f/4211/9641/7e3a7a4412b6/1080x1080.jpg" },
  { name: "The Untochables", url: `${TIDAL}/playlist/8a582064-e2f4-480f-821f-e9f00515f5fc`, blurb: "42 tracks", color: "#123f5c", mark: "💿" },
  { name: "New Rock", url: `${TIDAL}/playlist/4c045759-c8d0-4c6f-8ce1-f932804804ce`, blurb: "42 tracks", color: "#15485f", img: "https://resources.tidal.com/images/499e82e0/527f/4c48/b1f4/1762a74719ac/1080x1080.jpg" },
  { name: "TIDAL", url: `${TIDAL}/`, blurb: "Your full Hi-Fi library & mixes", color: "#0e1f2c", mark: "🌊" },
  { name: "YouTube Music", url: "https://music.youtube.com/", blurb: "Playlists, mixes & official videos", color: "#8f0a12", img: "https://music.youtube.com/img/youtube_music_preview.png" },
];

export default function Music() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState(""); // the submitted music search

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(q.trim());
  };
  const clearSearch = () => {
    setSearch("");
    setQ("");
  };

  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      {/* Title and search share one row. Search used to sit on its own line beneath the
          heading, costing ~56px above the player — on a 540px-tall TV that's a tenth of
          the screen spent on an input, pushing the video down. They wrap back to two
          rows below `sm`, so nothing is cramped on a narrow window. */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <Heading label="♛ Music" emoji="🎵" size="lg">
          Music Videos
        </Heading>

        <form onSubmit={submit} className="flex flex-1 items-center justify-end gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-focusable
            placeholder="Search any artist or song…"
            className="min-w-[10rem] max-w-sm flex-1 rounded-full border border-line bg-white/5 px-4 py-2 text-sm outline-none transition placeholder:text-cream/55 focus:border-gold/50 focus:bg-white/10"
          />
          <button type="submit" data-focusable className="btn-spray shrink-0 !px-4 !py-2 text-sm">
            🔎 Search
          </button>
          {search && (
            <button type="button" onClick={clearSearch} data-focusable className="btn-ghost shrink-0 !px-3 !py-2 text-sm">
              Clear ✕
            </button>
          )}
        </form>
      </div>

      {/* Search results play in the viewer (relevance order); otherwise the tabbed reel
          (`freshHours={12}` rotates a fresh lineup twice a day, cycling your whole
          catalog — these artist channels rarely post, so the reel walks the deep
          library instead of replaying the same handful — shuffled per visit). */}
      {search ? (
        <VideoHub key={`search-${search}`} tabs={[{ key: "search", label: `🔎 ${search}` }]} autoplay query={search} musicSearch />
      ) : (
        <VideoHub tabs={MUSIC_TABS} autoplay freshHours={12} />
      )}

      {/* Your streaming services */}
      <section className="mt-10">
        <Heading emoji="🎧" className="mb-4">Your Music — Tidal &amp; more</Heading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SERVICES.map((t) => (
            <LaunchTile key={t.name} t={t} />
          ))}
        </div>
        <p className="mt-4 text-sm text-cream/50">
          <b className="text-cream/70">🎧 My Mix</b> plays straight from your own YouTube playlists — Ol&apos; Skool,
          maxwell, R&amp;B, The King, 2Pac, B.I.G, Rock &amp; more — and they feed the genre tabs too, cycling fresh
          through the whole catalog (a new lineup every 12h). Grown &amp; lyrical, no ratchet or drill. Your deep
          catalog also lives in Tidal (you stay signed in on the TV).
        </p>
      </section>
    </div>
  );
}
