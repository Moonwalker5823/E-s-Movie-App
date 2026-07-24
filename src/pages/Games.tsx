import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";
import VideoHub, { type HubTab } from "../components/VideoHub";

// Video games + cars — auto-plays the top clip of the day. Car-heavy: real car
// shows (Top Gear feels) and racing alongside the gaming tabs.
const CLIP_TABS: HubTab[] = [
  { key: "gaming", label: "🎮 Games" },
  { key: "xbox", label: "🟢 Xbox" },
  { key: "cars", label: "🏎️ Cars & Top Gear" },
  { key: "racing", label: "🏁 Racing" },
  { key: "anime", label: "🥋 Anime" },
  { key: "gamesports", label: "🏈 Sports" },
];

// Browser-based cloud gaming — play right on the TV, no console hookup needed.
// Sign in with your Microsoft account to reach your Xbox / Game Pass library.
const XBOX: Tile[] = [
  { name: "Xbox Cloud Gaming", url: "https://www.xbox.com/play", blurb: "Stream your Game Pass library", color: "#107c10" },
  { name: "Xbox Game Pass", url: "https://www.xbox.com/xbox-game-pass", blurb: "Your games & subscription", color: "#0e6b0e" },
  { name: "Xbox Remote Play", url: "https://www.xbox.com/play/remote-play", blurb: "Stream your own console", color: "#144d14" },
  { name: "Xbox.com", url: "https://www.xbox.com/", blurb: "Store, profile & friends", color: "#0b3d0b" },
];

// Other free / included cloud-gaming services.
const CLOUD: Tile[] = [
  { name: "GeForce NOW", url: "https://play.geforcenow.com/", blurb: "Free tier — your Steam/Epic games", color: "#76b900" },
  { name: "Amazon Luna", url: "https://luna.amazon.com/", blurb: "Cloud games (Prime perks)", color: "#00a8e1" },
];

export default function Games() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Games" emoji="🎮" size="lg" className="mb-3">
        Cloud Gaming
      </Heading>

      {/* Featured games + cars at the very top. Full-length (not shorts-only) so
          car shows / Top Gear segments and anime episodes play in full. */}
      <VideoHub tabs={CLIP_TABS} autoplay />

      <Heading emoji="🟢" className="mb-2 mt-10">
        Xbox
      </Heading>
      <p className="mb-4 text-sm text-cream/60">
        Sign in with your Microsoft account to reach your Xbox &amp; Game Pass library — a Bluetooth
        controller pairs to the TV. (Remote Play streams your own console; it works best via the Xbox app.)
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {XBOX.map((t) => (
          <LaunchTile key={t.name} t={t} />
        ))}
      </div>

      <Heading emoji="☁️" className="mb-4 mt-10">
        More Cloud Gaming
      </Heading>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CLOUD.map((t) => (
          <LaunchTile key={t.name} t={t} />
        ))}
      </div>
    </div>
  );
}
