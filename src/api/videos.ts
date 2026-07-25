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
  opts: { short?: boolean; daily?: boolean; hours?: number } = {}
): Promise<Video[]> {
  const q = new URLSearchParams({ set });
  if (opts.short) q.set("short", "1");
  if (opts.daily) q.set("daily", "1");
  if (opts.hours && opts.hours > 0) q.set("hours", String(opts.hours));
  const r = await fetch(`/api/videos?${q.toString()}`);
  if (!r.ok) throw new Error(`videos ${r.status}`);
  const data = await r.json();
  return (data.items || []) as Video[];
}
