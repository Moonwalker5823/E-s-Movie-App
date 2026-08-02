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
