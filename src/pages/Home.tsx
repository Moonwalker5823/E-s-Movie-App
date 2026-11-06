import { useMemo } from "react";
import Hero from "../components/Hero";
import VideoHub, { type HubTab } from "../components/VideoHub";
import Row from "../components/Row";
import ContinueRow from "../components/home/ContinueRow";
import LiveNow from "../components/home/LiveNow";
import FreshHubs from "../components/home/FreshHubs";
import { HOME_RAILS, dedupe } from "../lib/interests";
import { recommendations } from "../api/tmdb";
import { seedIds, useFavorites } from "../lib/favorites";
import SetupNotice from "../components/SetupNotice";
import { hasTmdbKey } from "../api/tmdb";

// The command center. Home used to be a movie landing page — a hero plus TMDB rails —
// which meant the parts of the app that actually get opened (Sports, cars, games,
// music) were invisible until you went hunting for them in the nav.
//
// Order is deliberate, and the top two sections are CONDITIONAL:
//   1. Pick up where you left off — only if something is half-watched
//   2. Live Now                   — only if a game is actually in progress
//   3. The Mix                    — the everything-feed, playing. Used to be its own tab;
//                                   it earns the centerpiece instead of a nav slot.
//   4. Fresh in your hubs         — what's new across Sports / cars / games / music / …
//   5. Movies & TV                — the old home screen (hero + rails), now one section
// So the screen leads with something actionable when there IS something, and otherwise
// opens straight into something playing. No empty shelves either way.
const MIX_TABS: HubTab[] = [{ key: "mix", label: "The Mix" }];

export default function Home() {
  const favs = useFavorites();

  // "Because you liked…" — built from whatever is in My List.
  const recRail = useMemo(() => {
    const seeds = seedIds();
    if (seeds.length === 0) return null;
    return {
      key: "recs",
      title: "Because You Liked Your Favorites",
      emoji: "✨",
      load: async () => {
        const lists = await Promise.all(
          seeds.map((s) => recommendations(s.media_type, s.id).catch(() => []))
        );
        return dedupe(lists.flat());
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favs.length]);

  return (
    <div className="pb-10">
      <ContinueRow />
      <LiveNow />

      <section className="section">
        <div className="section-head px-4 sm:px-10">
          <h2 className="u-display text-2xl text-cream sm:text-3xl">The Mix</h2>
          <p className="mt-1 text-sm text-cream/60">
            Freshest across sports, music, comedy, cars &amp; tech — back to back.
          </p>
        </div>
        <div className="px-4 sm:px-10">
          {/* `cinema` drops the up-next tiles and browse grid, so it reads as one big
              player rather than another grid competing with the sections around it. */}
          <VideoHub tabs={MIX_TABS} autoplay cinema freshHours={3} />
        </div>
      </section>

      <FreshHubs />

      <section className="section">
        <div className="section-head px-4 sm:px-10">
          <h2 className="u-display text-2xl text-cream sm:text-3xl">Movies &amp; TV</h2>
        </div>
        {hasTmdbKey() ? (
          <>
            <Hero />
            <div className="mt-6 space-y-8">
              {recRail && (
                <Row key={recRail.key + favs.length} title={recRail.title} emoji={recRail.emoji} load={recRail.load} />
              )}
              {HOME_RAILS.map((r) => (
                <Row key={r.key} title={r.title} emoji={r.emoji} load={r.load} />
              ))}
            </div>
          </>
        ) : (
          <SetupNotice />
        )}
      </section>
    </div>
  );
}
