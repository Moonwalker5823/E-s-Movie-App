// The weekly cadence that wins leagues, as a day-aware checklist. Days are 0=Sun..6=Sat
// in ET (the fantasy week's timezone). "today" highlights what's due right now.

export type TaskKind = "waiver" | "trade" | "lineup" | "inactive";

export interface TaskDef {
  id: string;
  label: string;
  detail: string;
  days: number[]; // days of week this task is due (ET)
  kind: TaskKind;
}

export const WEEKLY_TASKS: TaskDef[] = [
  {
    id: "waivers",
    label: "Run waivers & adds/drops",
    detail: "Chase opportunity, not names — snap/target share, injury-vacated touches, handcuff your studs.",
    days: [2, 3], // Tue/Wed
    kind: "waiver",
  },
  {
    id: "trades",
    label: "Check trade opportunities",
    detail: "Buy low on underperformers, sell high on hot streaks, consolidate depth into a stud.",
    days: [2, 3],
    kind: "trade",
  },
  {
    id: "lineup",
    label: "Set your lineup",
    detail: "Start/sit by matchup, projection, injury, and bye. Lock it before kickoff.",
    days: [3, 4, 6], // Wed/Thu (+ Sat safety)
    kind: "lineup",
  },
  {
    id: "inactives",
    label: "Final inactive / injury check",
    detail: "Swap out anyone ruled OUT ~90 min before their game.",
    days: [0], // Sunday
    kind: "inactive",
  },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function etDay(): number {
  const wd = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "short" });
  const i = DAYS.indexOf(wd);
  return i < 0 ? new Date().getDay() : i;
}

export function todayLabel(): string {
  return DAYS[etDay()];
}

/** Tasks due today (ET). */
export function tasksForToday(): TaskDef[] {
  const d = etDay();
  return WEEKLY_TASKS.filter((t) => t.days.includes(d));
}
