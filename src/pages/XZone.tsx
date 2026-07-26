import Heading from "../components/ui/Heading";
import LaunchTile, { type Tile } from "../components/LaunchTile";

// Adult (18+) launch tiles. This tab can be hidden in Settings → Privacy.
// Like the Live TV tab, these are just curated external launchers — nothing is
// embedded or re-streamed here. Add/remove entries freely.
const SITES: Tile[] = [
  { name: "Baddies", url: "https://baddies.xxx/", blurb: "baddies.xxx", color: "#c2185b" },
  { name: "TastyBlacks", url: "https://tastyblacks.com/", blurb: "tastyblacks.com", color: "#4a148c" },
  { name: "Pornhub", url: "https://www.pornhub.com/", blurb: "pornhub.com", color: "#ff9000" },
  { name: "xHamster", url: "https://xhamster.com/", blurb: "xhamster.com", color: "#00abe1" },
  { name: "XVideos", url: "https://www.xvideos.com/", blurb: "xvideos.com", color: "#c9252b" },
  { name: "SpankBang", url: "https://spankbang.com/", blurb: "spankbang.com", color: "#ff1493" },
];

// After-dark ambiance: a soft, blurred pin-up silhouette with a neon wash. Suggestive
// but tasteful (no explicit imagery baked into the app). To use a real photo instead,
// drop a file in /public and swap this block for a background <img>.
function AfterDarkBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -1 }}>
      {/* sultry neon wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(760px 720px at 82% 24%, rgba(255,20,120,0.28), transparent 60%)," +
            "radial-gradient(680px 620px at 12% 88%, rgba(150,10,70,0.30), transparent 62%)," +
            "linear-gradient(180deg, rgba(10,4,10,0.35), rgba(10,4,10,0.65))",
        }}
      />
      {/* blurred model silhouette, lower-right */}
      <svg
        className="absolute bottom-0 right-[-4%] h-[94vh] w-auto opacity-[0.28] sm:right-[2%]"
        viewBox="0 0 240 620"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="x-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff3d8b" />
            <stop offset="1" stopColor="#7a0a2e" />
          </linearGradient>
          <filter id="x-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g filter="url(#x-soft)" fill="url(#x-skin)">
          {/* flowing hair */}
          <ellipse cx="120" cy="86" rx="46" ry="66" />
          {/* head */}
          <circle cx="120" cy="70" r="30" />
          {/* hourglass figure, arms at sides, legs together */}
          <path
            d="M110 92 C96 108 78 110 76 140 C72 160 72 175 78 195 C88 215 96 220 98 238
               C90 260 72 275 74 300 C78 350 86 400 92 440 C95 470 100 520 106 560
               C108 580 108 595 110 602 L132 602 C134 595 134 580 136 560
               C142 520 147 470 150 440 C156 400 164 350 168 300 C170 275 152 260 144 238
               C146 220 154 215 164 195 C170 175 170 160 166 140 C164 110 146 108 132 92 Z"
          />
        </g>
      </svg>
    </div>
  );
}

export default function XZone() {
  return (
    <div className="relative px-4 py-6 sm:px-8">
      <AfterDarkBackdrop />

      <Heading label="♛ After Dark" emoji="🔞" size="xl">
        X
      </Heading>
      <p className="mt-2 text-cream/60">
        Adult (18+) launchers. One tap opens the site on your TV. Hide this tab anytime in{" "}
        <b>Settings → Privacy</b>.
      </p>
      <p className="mt-3 rounded-xl border border-spray/30 bg-spray/5 p-3 text-sm text-cream/80">
        🔞 For adults only. These open external sites in their own tab — nothing plays inside this app.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {SITES.map((t) => (
          <LaunchTile key={t.name} t={t} />
        ))}
      </div>
    </div>
  );
}
