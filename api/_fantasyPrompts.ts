// Shared prompt builders for the multi-mode fantasy assistant. The underscore prefix
// keeps Vercel from exposing this as its own routable endpoint.

export type Mode = "draft" | "start_sit" | "waivers" | "trade" | "weekly_plan";

interface Built {
  system: string;
  user: string;
  maxTokens: number;
}

const JSON_ONLY = (shape: string) => `Reply ONLY with minified JSON: ${shape}. No prose outside the JSON.`;

export function buildPrompt(mode: Mode, body: any): Built | null {
  const {
    question,
    roster = [],
    available = [],
    needs = {},
    starters = [],
    slots = [],
    week,
    scoring = "standard",
    trending = [],
    leagueRosters = [],
  } = body || {};

  const rosterStr = roster.length ? roster.join(", ") : "empty";
  const scoringLine = `Scoring: ${scoring}.`;

  switch (mode) {
    case "draft":
      return {
        maxTokens: 400,
        system: [
          "You are an elite fantasy football draft assistant helping during a LIVE draft.",
          "Use your current knowledge of the NFL. Be decisive and concise.",
          "Weigh value (ADP), positional need, bye weeks, upside, and scarcity.",
          JSON_ONLY('{"recommendation":string,"reason":string,"alternates":string[]}'),
          "recommendation = one player name; reason = 1-2 sentences; alternates = up to 3 names.",
        ].join(" "),
        user: [
          question ? `Question: ${question}` : "Who should I draft next?",
          scoringLine,
          `My roster so far: ${rosterStr}.`,
          `My positional needs: ${JSON.stringify(needs)}.`,
          `Top available players (by ADP): ${available.slice(0, 40).join(", ")}.`,
        ].join("\n"),
      };

    case "start_sit":
      return {
        maxTokens: 450,
        system: [
          "You are an elite fantasy football start/sit advisor for THIS week.",
          "Use current NFL knowledge: matchups, injuries, roles, weather, and byes.",
          JSON_ONLY('{"starters":string[],"sit":string[],"reason":string}'),
          "starters = player names to start (fill every starting slot); sit = names to bench; reason = 1-3 sentences.",
        ].join(" "),
        user: [
          `Week ${week}. ${scoringLine}`,
          `My roster: ${rosterStr}.`,
          `Starting slots to fill: ${slots.join(", ")}.`,
          question ? `Note: ${question}` : "",
        ].filter(Boolean).join("\n"),
      };

    case "waivers":
      return {
        maxTokens: 550,
        system: [
          "You are an elite fantasy football waiver-wire advisor.",
          "Prioritize opportunity (snap/target share, injury-vacated touches, handcuffs) over name value.",
          JSON_ONLY('{"adds":[{"name":string,"pos":string,"reason":string,"priority":"high"|"med"|"low"}],"drops":string[]}'),
          "Up to 6 adds ranked by priority; drops = names on my roster I can safely cut.",
        ].join(" "),
        user: [
          `Week ${week}. ${scoringLine}`,
          `My roster: ${rosterStr}.`,
          `My positional needs: ${JSON.stringify(needs)}.`,
          trending.length ? `Trending adds right now: ${trending.slice(0, 25).join(", ")}.` : "",
          available.length ? `Some available players: ${available.slice(0, 30).join(", ")}.` : "",
        ].filter(Boolean).join("\n"),
      };

    case "trade":
      return {
        maxTokens: 700,
        system: [
          "You are an elite fantasy football trade strategist.",
          "Buy low / sell high; consolidate depth into difference-makers; target my needs and exploit others' roster gaps.",
          JSON_ONLY('{"ideas":[{"give":string[],"get":string[],"reason":string}]}'),
          "2-4 realistic ideas. give/get = player names (get can name a target player or a position).",
        ].join(" "),
        user: [
          scoringLine,
          `My roster: ${rosterStr}.`,
          `My positional needs: ${JSON.stringify(needs)}.`,
          leagueRosters.length ? `Other teams' rosters: ${JSON.stringify(leagueRosters).slice(0, 1500)}.` : "",
          question ? `Note: ${question}` : "",
        ].filter(Boolean).join("\n"),
      };

    case "weekly_plan":
      return {
        maxTokens: 700,
        system: [
          "You are an elite fantasy football manager writing this week's action plan.",
          "Be specific and prioritized: lineup moves, waiver targets, and any trade angle.",
          JSON_ONLY('{"summary":string,"tasks":[{"label":string,"detail":string}]}'),
          "summary = 2-4 sentences; tasks = 3-6 concrete to-dos for the week.",
        ].join(" "),
        user: [
          `Week ${week}. ${scoringLine}`,
          `My roster: ${rosterStr}.`,
          `My positional needs: ${JSON.stringify(needs)}.`,
          starters.length ? `Current starters: ${starters.join(", ")}.` : "",
          trending.length ? `Trending adds: ${trending.slice(0, 20).join(", ")}.` : "",
        ].filter(Boolean).join("\n"),
      };

    default:
      return null;
  }
}
