import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Heading from "../components/ui/Heading";
import Chip from "../components/ui/Chip";
import { isBoardStale, refreshBoard } from "../lib/fantasy/board";
import HubTab from "../components/fantasy/HubTab";
import DraftTab from "../components/fantasy/DraftTab";
import MyTeamTab from "../components/fantasy/MyTeamTab";
import ThisWeekTab from "../components/fantasy/week/ThisWeekTab";
import AnalyticsTab from "../components/fantasy/analytics/AnalyticsTab";

const TABS = [
  { key: "hub", label: "🏠 Hub" },
  { key: "draft", label: "📋 Draft" },
  { key: "team", label: "🧢 My Team" },
  { key: "week", label: "📅 This Week" },
  { key: "analytics", label: "📊 Analytics" },
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
      {tab === "draft" && <DraftTab />}
      {tab === "team" && <MyTeamTab />}
      {tab === "week" && <ThisWeekTab />}
      {tab === "analytics" && <AnalyticsTab />}
    </div>
  );
}
