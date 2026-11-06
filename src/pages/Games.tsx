import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";
import VideoHub, { type HubTab } from "../components/VideoHub";

// Video games + cars — auto-plays the top clip of the day. Car-heavy, and REAL cars:
// the Cars tab is road tests and drag races from people who actually drive them
// (carwow, Throttle House, Straight Pipes, savagegeese, Hagerty) plus F1 + IndyCar.
// Game car channels (Forza, Rocket League) stay in Games, where the point is what's
// newly released. His BMW and the Stage 2 build he's planning share one tab.
const CLIP_TABS: HubTab[] = [
  { key: "gaming", label: "🎮 Games" },
  { key: "mybmw", label: "🚗 My BMW · Stage 2", q: "BMW 640i stage 2" }, // Eric's ride + the tune he's planning
  { key: "xbox", label: "🟢 Xbox" },
  { key: "motors", label: "🏎️ Cars & Racing" }, // real-car road tests + drag races, F1 & IndyCar
];

// Browser-based cloud gaming — play right on the TV, no console hookup needed.
// Sign in with your Microsoft account to reach your Xbox / Game Pass library.
const XBOX: Tile[] = [
  { name: "Xbox Cloud Gaming", url: "https://www.xbox.com/play", blurb: "Stream your Game Pass library", color: "#107c10", mark: "🎮" },
  { name: "Xbox Game Pass", url: "https://www.xbox.com/xbox-game-pass", blurb: "Your games & subscription", color: "#0e6b0e", mark: "🟢" },
  { name: "Xbox Remote Play", url: "https://www.xbox.com/play/remote-play", blurb: "Stream your own console", color: "#144d14", mark: "📡" },
  { name: "Xbox.com", url: "https://www.xbox.com/", blurb: "Store, profile & friends", color: "#0b3d0b", mark: "✖️" },
];

// Other free / included cloud-gaming services.
const CLOUD: Tile[] = [
  { name: "GeForce NOW", url: "https://play.geforcenow.com/", blurb: "Free tier — your Steam/Epic games", color: "#76b900", img: "https://www.nvidia.com/content/dam/en-zz/Solutions/gfn/webassets/geforce-now-og-no-text-1200x630.jpg" },
  { name: "Amazon Luna", url: "https://luna.amazon.com/", blurb: "Cloud games (Prime perks)", color: "#00a8e1", img: "https://m.media-amazon.com/images/G/01/T/TC05316421/Evergreen/LunaClient/SEO/SEO_Thumbnail_1200x630.png" },
];

export default function Games() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Arcade" emoji="🎮" size="lg" className="mb-3">
        Games, Cars &amp; Rides
      </Heading>

      {/* Featured games + cars at the very top. Full-length (not shorts-only) so
          road tests and drag races play in full. `freshHours={12}` rotates a
          fresh lineup twice a day, cycling the whole catalog. */}
      <VideoHub tabs={CLIP_TABS} autoplay freshHours={12} />

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
