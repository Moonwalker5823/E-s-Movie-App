export type Pos = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export interface Player {
  id: string;
  name: string;
  pos: Pos;
  team: string; // NFL team abbr
  bye: number; // bye week
  adp: number; // average draft position (lower = earlier)
  tier: number; // positional tier (1 = elite)
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
