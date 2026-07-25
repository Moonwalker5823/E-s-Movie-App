import Heading from "../components/ui/Heading";
import VideoHub, { type HubTab } from "../components/VideoHub";

// The Mix — one big cinema player running a personalized compilation of the freshest
// top content across every page: news, sports, comedy, clips, tech & more, back to
// back. Refreshes every few hours; the order is shuffled each visit.
const MIX_TABS: HubTab[] = [{ key: "mix", label: "The Mix" }];

export default function TheMix() {
  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ The Mix" emoji="🎛️" size="lg" className="mb-3">
        Your Feed
      </Heading>

      {/* One big compilation player — news, sports, comedy, clips & more, back to back.
          `cinema` drops the up-next tiles + browse grid so it's just the player. */}
      <VideoHub tabs={MIX_TABS} autoplay cinema freshHours={3} />
    </div>
  );
}
