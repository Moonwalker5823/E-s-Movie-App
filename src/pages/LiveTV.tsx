import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";

// Eric's paid provider — Spectrum (incl. the Xumo box). Sign in once in the app.
const PROVIDER: Tile[] = [
  { name: "Spectrum TV", url: "https://watch.spectrum.net/", blurb: "Your live cable channels & DVR", color: "#0033a0" },
  { name: "Spectrum Guide", url: "https://www.spectrum.net/tv/channel-lineup", blurb: "Your channel lineup", color: "#1a2b6b" },
];

// Free ad-supported streaming apps (FAST) — the real path to replacing paid live TV.
const FAST_APPS: Tile[] = [
  { name: "TheTVApp", url: "https://thetvapp.to/", blurb: "Live TV, sports & PPV", color: "#e11d48" },
  { name: "Pluto TV", url: "https://pluto.tv/en/live-tv", blurb: "100s of free live channels", color: "#0b1636" },
  { name: "Tubi", url: "https://tubitv.com/live", blurb: "Free movies, TV & live news", color: "#7d1aff" },
  { name: "Samsung TV Plus", url: "https://www.samsung.com/us/tvplus/", blurb: "Free live channels", color: "#1428a0" },
  { name: "The Roku Channel", url: "https://therokuchannel.roku.com/", blurb: "Free live TV & movies", color: "#662d91" },
  { name: "Plex Live TV", url: "https://watch.plex.tv/live-tv", blurb: "Free live TV & on-demand", color: "#8b6a0d" },
  { name: "Xumo Play", url: "https://play.xumo.com/", blurb: "Free live & on-demand", color: "#0a4d68" },
];

// Free with a library card / public domain — huge legit catalogs, zero cost.
const LIBRARY_APPS: Tile[] = [
  { name: "Kanopy", url: "https://www.kanopy.com/", blurb: "Free w/ library card — top films", color: "#e64a19" },
  { name: "Hoopla", url: "https://www.hoopladigital.com/", blurb: "Free w/ library card — movies & TV", color: "#1565c0" },
  { name: "Internet Archive", url: "https://archive.org/details/movies", blurb: "Public-domain classics, free", color: "#2e5b3e" },
];

// Legal 24/7 live channels on YouTube — grouped by Eric's interests. These open
// the live stream on YouTube (reliable) rather than an embed that breaks.
const CHANNELS: { category: string; items: Tile[] }[] = [
  {
    category: "News",
    items: [
      { name: "ABC News Live", url: "https://www.youtube.com/@ABCNews/live", blurb: "24/7 breaking news", color: "#c60000" },
      { name: "NBC News NOW", url: "https://www.youtube.com/@NBCNews/live", blurb: "Live U.S. news", color: "#6a2fb0" },
      { name: "Bloomberg TV", url: "https://www.youtube.com/@markets/live", blurb: "Markets & business", color: "#0a4d68" },
    ],
  },
  {
    category: "Music",
    items: [
      { name: "Lofi Girl", url: "https://www.youtube.com/@LofiGirl/live", blurb: "Beats to relax/study", color: "#7d3cff" },
      { name: "NPR Music", url: "https://www.youtube.com/@nprmusic/streams", blurb: "Tiny Desk & live sets", color: "#b8341f" },
    ],
  },
  {
    category: "Cars",
    items: [
      { name: "Top Gear", url: "https://www.youtube.com/@TopGear/streams", blurb: "The classic car show", color: "#000000" },
      { name: "Motor Trend", url: "https://www.youtube.com/@MotorTrend/streams", blurb: "Cars, builds & reviews", color: "#c81d25" },
      { name: "Donut", url: "https://www.youtube.com/@donut/streams", blurb: "Car culture & fun", color: "#e2b100" },
    ],
  },
];

export default function LiveTV() {
  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Live TV" emoji="📡" size="xl">
        Free Live TV
      </Heading>
      <p className="mt-2 text-cream/60">
        Legit free live services — a real way to replace paid live TV. One tap opens the app on your TV.
      </p>

      <Heading emoji="📺" className="mb-4 mt-8">
        Your Cable — Spectrum
      </Heading>
      <p className="mb-4 text-sm text-cream/60">
        You&apos;re a Spectrum subscriber (with the Xumo box) — jump straight into your live channels.
        Sign in on Spectrum&apos;s own site.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {PROVIDER.map((a) => (
          <LaunchTile key={a.name} t={a} />
        ))}
      </div>

      <Heading emoji="🆓" className="mb-4 mt-10">
        Free Channel Apps
      </Heading>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {FAST_APPS.map((a) => (
          <LaunchTile key={a.name} t={a} />
        ))}
      </div>

      <Heading emoji="📚" className="mb-4 mt-10">
        Free With Your Library Card
      </Heading>
      <p className="mb-4 text-sm text-cream/60">
        Real movie catalogs, totally free with a public library card — plus public-domain classics.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {LIBRARY_APPS.map((a) => (
          <LaunchTile key={a.name} t={a} />
        ))}
      </div>

      {CHANNELS.map((group) => (
        <div key={group.category} className="mt-10">
          <Heading className="mb-4">{group.category} — Live on YouTube</Heading>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((c) => (
              <LaunchTile key={c.name} t={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
