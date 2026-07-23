import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";
import Row from "../components/Row";
import { byKeyword } from "../api/tmdb";
import { dedupe } from "../lib/interests";

const BUD_TABS: HubTab[] = [{ key: "weed", label: "🌿 Bud TV" }];

export default function SmokersLounge() {
  return (
    <div className="px-4 py-6 sm:px-8">
      <Heading label="♛ Smokers Lounge" emoji="🌿" size="xl">
        Smoke Sessions
      </Heading>
      <p className="mt-2 text-cream/60">
        Snoop&apos;s GGN, the Smoke Box, and the best bud videos — plus stoner movie picks. Spark up.
      </p>

      {/* Bud TV — weed video hub */}
      <section className="mt-6">
        <Heading emoji="📺" className="mb-4">Bud TV</Heading>
        <VideoHub tabs={BUD_TABS} autoplay short />
      </section>

      {/* Stoner movies from TMDB (hidden automatically if no TMDB key is set) */}
      <section className="mt-12 space-y-8">
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
