import Heading from "../ui/Heading";
import LeagueSettings from "./LeagueSettings";
import { useDraft, myRoster } from "../../lib/fantasy/draft";

/** Your roster + the editable league settings. */
export default function MyTeamTab() {
  useDraft();
  const roster = myRoster();

  return (
    <div className="space-y-8">
      <section>
        <Heading emoji="🧢" className="mb-3">My Roster</Heading>
        {roster.length === 0 ? (
          <p className="text-sm text-cream/50">No players yet — draft your team in the Draft Room.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roster.map((p) => (
              <span key={p.id} className="rounded-lg border border-line bg-white/5 px-3 py-1.5 text-sm">
                <b className="font-display text-cream">{p.pos}</b>{" "}
                <span className="text-cream/80">{p.name}</span>{" "}
                <span className="text-cream/40">{p.team}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <Heading emoji="⚙️" className="mb-3">League Settings</Heading>
        <LeagueSettings />
      </section>
    </div>
  );
}
