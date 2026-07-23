import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";

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
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Games" emoji="🎮" size="xl">
        Cloud Gaming
      </Heading>
      <p className="mt-2 text-cream/60">
        Play right on the TV through the browser. Sign in with your Microsoft account to reach your
        Xbox &amp; Game Pass library — a Bluetooth controller pairs to the TV. (Remote Play streams
        your own console; it works best via the Xbox app.)
      </p>

      <Heading emoji="🟢" className="mb-4 mt-8">
        Xbox
      </Heading>
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
