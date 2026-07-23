import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";
import LaunchTile, { type Tile } from "../components/LaunchTile";
import { factOfTheDay } from "../lib/facts";

// The black nerd in you — science, tech, big ideas, code, and the weird stuff.
const BLERD_TABS: HubTab[] = [
  { key: "blerd", label: "🧠 Mix" },
  { key: "science", label: "🔬 Science" },
  { key: "tech", label: "📱 Tech & Gear" },
  { key: "ted", label: "🎤 TED" },
  { key: "aliens", label: "👽 Ancient Aliens" },
  { key: "code", label: "💻 Code" },
];

// Nerd news, gear drops, and dev culture — one tap opens the site.
const NEWS: Tile[] = [
  { name: "The Verge", url: "https://www.theverge.com/", blurb: "New apps, gadgets & electronics", color: "#5200ff" },
  { name: "Hacker News", url: "https://news.ycombinator.com/", blurb: "What devs are reading", color: "#ff6600" },
  { name: "Product Hunt", url: "https://www.producthunt.com/", blurb: "New apps launching daily", color: "#da552f" },
  { name: "GitHub Trending", url: "https://github.com/trending", blurb: "Hot repos right now", color: "#2dba4e" },
  { name: "Ars Technica", url: "https://arstechnica.com/", blurb: "Deep tech & science news", color: "#ff4e00" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/", blurb: "Emerging tech & research", color: "#a6093d" },
];

export default function Blerd() {
  const fact = factOfTheDay();
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Blerd" emoji="🤓" size="lg" className="mb-3">
        Black Nerd HQ
      </Heading>

      {/* Featured video at the very top */}
      <VideoHub tabs={BLERD_TABS} autoplay short />

      {/* Fact of the Day — rotates daily */}
      <section className="mt-10">
        <div className="card overflow-hidden p-0">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <div className="u-label !rotate-0 text-yellow">📅 Fact of the Day</div>
              <div className="mt-1 inline-block rounded-md bg-spray/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-spray">
                {fact.tag}
              </div>
            </div>
            <p className="text-lg font-semibold leading-snug text-cream sm:text-xl">{fact.text}</p>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-spray via-yellow to-cyan" />
        </div>
      </section>

      {/* Nerd news & gear */}
      <section className="mt-10">
        <Heading emoji="🚀" className="mb-4">Nerd News &amp; New Gear</Heading>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {NEWS.map((t) => (
            <LaunchTile key={t.name} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
