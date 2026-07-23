import { Link } from "react-router-dom";
import PlayerPool from "../components/fantasy/PlayerPool";
import RosterPanel from "../components/fantasy/RosterPanel";
import AssistantPanel from "../components/fantasy/AssistantPanel";
import Heading from "../components/ui/Heading";
import { SEED_NOTE } from "../data/players";

/** The live draft room — TV-friendly. Board + AI assistant + your roster. */
export default function DraftRoom() {
  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Heading label="♛ Live Draft" emoji="🏈" size="xl">
          Draft Room
        </Heading>
        <Link to="/fantasy" data-focusable className="btn-ghost">
          ← Back to Fantasy
        </Link>
      </div>
      <p className="mb-5 text-sm text-cream/50">{SEED_NOTE}</p>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <PlayerPool />
        <div className="flex flex-col gap-5">
          <AssistantPanel />
          <RosterPanel />
        </div>
      </div>
    </div>
  );
}
