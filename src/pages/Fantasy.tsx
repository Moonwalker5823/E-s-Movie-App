import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import { isBoardStale, refreshBoard } from "../lib/fantasy/board";
import HubTab from "../components/fantasy/HubTab";
import DraftTab from "../components/fantasy/DraftTab";
import YahooTeamTab from "../components/fantasy/yahoo/YahooTeamTab";
import YahooLeagueTab from "../components/fantasy/yahoo/YahooLeagueTab";

// My Team / League are live from Yahoo (the Jones Family League) via /api/yahoo/*. They
// stay visible when Yahoo isn't connected — each one explains the one setup step it
// needs instead of vanishing, since a missing tab reads as a bug from the couch.
const TABS = [
  { key: "hub", label: "🏠 Hub" },
  { key: "team", label: "🧢 My Team" },
  { key: "league", label: "📊 League" },
  { key: "draft", label: "📋 Draft" },
];

export default function Fantasy() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "hub";

  // Load the live Sleeper board once for the whole section (cached 24h) so roster
  // resolution, waivers, and analytics work on any tab — not only after the Draft Room.
  useEffect(() => {
    if (isBoardStale()) refreshBoard();
  }, []);
  // `replace` so pressing Back leaves Fantasy rather than cycling through tabs;
  // the ?tab= param still makes each tab deep-linkable.
  const setTab = (key: string) => setParams(key === "hub" ? {} : { tab: key }, { replace: true });

  return (
    <div className="px-4 pb-8 pt-4 sm:px-10">
      <Heading label="♛ Fantasy Football" emoji="🏈" size="lg" className="mb-3">
        Championship HQ
      </Heading>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {tab === "hub" && <HubTab />}
      {tab === "team" && <YahooTeamTab />}
      {tab === "league" && <YahooLeagueTab />}
      {tab === "draft" && <DraftTab />}
    </div>
  );
}
