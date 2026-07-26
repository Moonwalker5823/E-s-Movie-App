export type Pos = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: string;
  name: string;
  pos: Pos;
  team: string; // NFL team abbr
  bye: number; // bye week
  adp: number; // average draft position (lower = earlier)
  tier: number; // positional tier (1 = elite)
  // Optional fields populated from the live board / provider (all optional so the
  // static seed data still type-checks).
  searchRank?: number; // Sleeper overall search rank (≈ ADP order)
  projPts?: number; // weekly projected points, when a source provides it
  opp?: string; // this week's opponent (e.g. "@KC")
  status?: string; // injury/roster status ("Q", "IR", "OUT", …)
}

export type DraftedBy = "me" | "other";

export interface DraftPick {
  playerId: string;
  by: DraftedBy;
  overall: number; // pick number
}

export interface RosterSettings {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number; // RB/WR/TE
  SUPERFLEX: number; // QB/RB/WR/TE (0 in most leagues)
  K: number;
  DST: number;
  BENCH: number;
}

export interface AssistantPick {
  recommendation: string; // player name
  reason: string;
  alternates: string[];
  source: "claude" | "offline";
}

export type AiSource = "claude" | "offline";

export interface StartSitResult {
  starters: string[]; // player names to start
  sit: string[]; // player names to bench
  reason: string;
  source: AiSource;
}

export interface WaiverAdd {
  name: string;
  pos?: string;
  reason: string;
  priority: "high" | "med" | "low";
}

export interface WaiverResult {
  adds: WaiverAdd[];
  drops: string[]; // player names you can safely drop
  reason?: string;
  source: AiSource;
}

export interface TradeIdea {
  give: string[];
  get: string[];
  reason: string;
}

export interface TradeResult {
  ideas: TradeIdea[];
  source: AiSource;
}

export interface WeeklyPlanResult {
  summary: string;
  tasks: { label: string; detail: string }[];
  source: AiSource;
}
