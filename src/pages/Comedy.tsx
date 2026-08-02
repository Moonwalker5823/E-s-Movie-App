import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";

// Comedy — sketches, stand-up, roasts & wind-down clips. Kevin Hart, Katt Williams and
// similar comedians (KevOnStage, Tony Baker, DC Young Fly, Karlous) all ride in the "Mix"
// tab — no separate per-comedian tabs. The legends Eric loves (Bernie Mac, Martin,
// Chappelle, Chris Rock, Eddie Murphy, Richard Pryor) have no live channels of their own,
// so their clips come through Comedy Central / Netflix Is A Joke / Wild 'N Out. Rotates
// fresh every 12h, shuffled each visit.
const COMEDY_TABS: HubTab[] = [
  { key: "comedy", label: "🔥 Mix" },
  { key: "standup", label: "🎙️ Stand-Up" },
  { key: "skits", label: "🎭 Skits & Roasts" },
  { key: "ridiculousness", label: "😂 Ridiculousness" },
];

export default function Comedy() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Comedy" emoji="😂" size="lg" className="mb-3">
        Comedy Club
      </Heading>

      {/* Featured comedy auto-plays at the top; picking a clip loads it in the viewer.
          `freshHours={12}` rotates a fresh lineup twice a day. */}
      <VideoHub tabs={COMEDY_TABS} autoplay freshHours={12} />
    </div>
  );
}
