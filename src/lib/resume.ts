// Cross-session "pick up where you left off" for the video reels. Keyed by hub tab, so
// each reel (Sports, Music, Comedy, …) remembers its own last-played clip + timestamp.
// Best-effort: if storage is unavailable it simply won't offer a resume.

const KEY = "ema.resume.v1";
const TTL = 1000 * 60 * 60 * 24 * 3; // 3 days — a spot older than that isn't useful

export interface ResumePoint {
  videoId: string;
  seconds: number;
  title: string;
  at: number;
  /** Route the clip was playing on, e.g. "/sports". Lets the home screen link straight
   *  back to it. Optional because entries saved before this existed won't have it —
   *  those are simply skipped on the home rail rather than linking somewhere wrong. */
  path?: string;
}

type Store = Record<string, ResumePoint>;

function read(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

export function saveResume(tab: string, r: Omit<ResumePoint, "at">) {
  const store = read();
  store[tab] = { ...r, at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full / disabled — resume just won't persist */
  }
}

export function getResume(tab: string): ResumePoint | null {
  const r = read()[tab];
  if (!r || Date.now() - r.at >= TTL) return null;
  return r;
}

export interface ResumeEntry extends ResumePoint {
  tab: string;
}

/** Every still-fresh resume point, newest first — what the home screen's "Continue
 *  Watching" rail is built from. Entries without a `path` are dropped: they predate
 *  route tracking, and a card that can't take you back is worse than no card. */
export function listResume(limit = 8): ResumeEntry[] {
  const store = read();
  const now = Date.now();
  return Object.entries(store)
    .map(([tab, r]) => ({ ...r, tab }))
    .filter((r) => r.path && now - r.at < TTL && r.seconds > 10)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}
