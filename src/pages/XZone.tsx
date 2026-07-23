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

export default function XZone() {
  return (
    <div className="px-4 py-6 sm:px-8">
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
