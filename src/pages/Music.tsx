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

// One tap into your services — you stay signed in via the TV app / native apps.
const SERVICES: Tile[] = [
  { name: "TIDAL", url: "https://listen.tidal.com/", blurb: "Your Hi-Fi library, music videos & mixes", color: "#0e1f2c" },
  { name: "YouTube Music", url: "https://music.youtube.com/", blurb: "Playlists, mixes & official videos", color: "#8f0a12" },
  { name: "Vevo", url: "https://www.vevo.com/", blurb: "Official music videos", color: "#7a0f2c" },
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
      <Heading label="♛ Music" emoji="🎵" size="lg" className="mb-3">
        Music Videos
      </Heading>

      {/* Music-only search — any artist or song, results play in the viewer below. */}
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-focusable
          placeholder="Search any artist or song…"
          className="min-w-[12rem] flex-1 rounded-full border border-line bg-white/5 px-4 py-2 text-sm outline-none transition placeholder:text-cream/30 focus:border-spray/50 focus:bg-white/10 sm:max-w-md"
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

      {/* Search results play in the viewer (relevance order); otherwise the tabbed reel
          (`daily` rotates a fresh on-topic lineup each day, shuffled per visit). */}
      {search ? (
        <VideoHub key={`search-${search}`} tabs={[{ key: "search", label: `🔎 ${search}` }]} autoplay query={search} musicSearch />
      ) : (
        <VideoHub tabs={MUSIC_TABS} autoplay daily />
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
          maxwell, R&amp;B, The King, 2Pac, B.I.G, Rock &amp; more — and they feed the genre tabs too, rotating fresh
          each day. Grown &amp; lyrical, no ratchet or drill. Your deep catalog also lives in Tidal (you stay signed in
          on the TV).
        </p>
      </section>
    </div>
  );
}
