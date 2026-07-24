import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";
import LaunchTile, { type Tile } from "../components/LaunchTile";

// Music videos across your tastes — R&B, soul, hip-hop, rock & classics. The reel
// stays fresh as these channels post; Tidal covers your personalized/era library.
const MUSIC_TABS: HubTab[] = [
  { key: "music", label: "🎧 Mix" },
  { key: "golden", label: "🔥 Golden Era" },
  { key: "yomtvraps", label: "📼 Yo! MTV Raps" },
  { key: "lyricists", label: "🎤 Lyricists" },
  { key: "soul", label: "🎶 R&B / Soul" },
  { key: "classics", label: "👑 Legends" },
  { key: "tinydesk", label: "🎙️ Tiny Desk" },
];

// One tap into your services — you stay signed in via the TV app / native apps.
const SERVICES: Tile[] = [
  { name: "TIDAL", url: "https://listen.tidal.com/", blurb: "Your Hi-Fi library, music videos & mixes", color: "#0e1f2c" },
  { name: "YouTube Music", url: "https://music.youtube.com/", blurb: "Playlists, mixes & official videos", color: "#8f0a12" },
  { name: "Vevo", url: "https://www.vevo.com/", blurb: "Official music videos", color: "#7a0f2c" },
];

export default function Music() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Music" emoji="🎵" size="lg" className="mb-3">
        Music Videos
      </Heading>

      {/* Featured music video streams at the top; picking a clip loads it in the viewer. */}
      <VideoHub tabs={MUSIC_TABS} autoplay />

      {/* Your streaming services */}
      <section className="mt-10">
        <Heading emoji="🎧" className="mb-4">Your Music — Tidal &amp; more</Heading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SERVICES.map((t) => (
            <LaunchTile key={t.name} t={t} />
          ))}
        </div>
        <p className="mt-4 text-sm text-cream/50">
          Golden-era &amp; lyrical — Jay-Z, Nas, DMX, Big Daddy Kane, Kendrick, J. Cole, Lupe, Gambino, Tems, the King &amp;
          more, no ratchet or drill. Your deep catalog and personalized mixes live in Tidal (you stay signed in on the TV).
        </p>
      </section>
    </div>
  );
}
