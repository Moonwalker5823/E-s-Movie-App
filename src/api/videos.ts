// Client for the /api/videos serverless engine (Sports highlights, Bud TV, Blerd, Games).
export interface Video {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
  durationSec?: number;
}

/** `short`: clips ≤5 min. `daily`: a fresh date-seeded rotation (changes the lineup
 *  day to day). `hours`: rotate every N hours instead of daily (Sports: 3). */
export async function videos(
  set: string,
  opts: { short?: boolean; daily?: boolean; hours?: number; q?: string; music?: boolean } = {}
): Promise<Video[]> {
  const params = new URLSearchParams({ set });
  if (opts.q) params.set("q", opts.q); // search — overrides the channel set
  if (opts.music) params.set("music", "1"); // bias the search toward songs (Music page)
  if (opts.short) params.set("short", "1");
  if (opts.daily) params.set("daily", "1");
  if (opts.hours && opts.hours > 0) params.set("hours", String(opts.hours));
  const r = await fetch(`/api/videos?${params.toString()}`);
  if (!r.ok) throw new Error(`videos ${r.status}`);
  // Under plain `vite dev` there's no serverless runtime, so this route falls through
  // to the SPA's index.html (200, but HTML). Surface that as a distinct error so the
  // hub can show the "runs on the live site" hint instead of a generic retry.
  let data: { items?: Video[] };
  try {
    data = await r.json();
  } catch {
    throw new Error("videos non-json");
  }
  return (data.items || []) as Video[];
}
