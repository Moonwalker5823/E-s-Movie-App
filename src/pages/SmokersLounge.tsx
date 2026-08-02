import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";
import Row from "../components/Row";
import { byKeyword } from "../api/tmdb";
import { dedupe } from "../lib/interests";

// A full cannabis hub — sessions & culture, weed-inspired recipes, and growers tips —
// not just Snoop and smoking vlogs. `freshHours={12}` rotates each tab twice a day.
const BUD_TABS: HubTab[] = [
  { key: "lounge", label: "🔥 Mix" },
  { key: "sessions", label: "🌿 Sessions" },
  { key: "edibles", label: "🍽️ Recipes" },
  { key: "grow", label: "🌱 Growers" },
];

export default function SmokersLounge() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Smokers Lounge" emoji="🌿" size="lg" className="mb-3">
        Smoke Sessions
      </Heading>

      {/* Featured lounge content at the top — full-length sessions, recipes & grow tips. */}
      <VideoHub tabs={BUD_TABS} autoplay freshHours={12} />

      {/* Stoner movies from TMDB (hidden automatically if no TMDB key is set) */}
      <section className="mt-10 space-y-8">
        <Row
          title="Stoner Classics"
          emoji="🎬"
          load={async () => dedupe([...(await byKeyword("movie", "stoner")), ...(await byKeyword("movie", "marijuana"))])}
        />
        <Row
          title="Higher Vibes — More Bud Comedies"
          emoji="😂"
          load={async () => dedupe([...(await byKeyword("movie", "cannabis")), ...(await byKeyword("movie", "weed"))])}
        />
      </section>
    </div>
  );
}
