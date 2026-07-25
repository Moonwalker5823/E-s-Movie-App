// Client for the /api/videos serverless engine (Sports highlights, Bud TV, Blerd, Games).
export interface Video {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
  durationSec?: number;
}

/** `short`: clips ≤5 min (shorts-only tabs). `daily`: a fresh date-seeded rotation
 *  that changes the lineup day to day (Music / Smokers Lounge). */
export async function videos(set: string, opts: { short?: boolean; daily?: boolean } = {}): Promise<Video[]> {
  const q = new URLSearchParams({ set });
  if (opts.short) q.set("short", "1");
  if (opts.daily) q.set("daily", "1");
  const r = await fetch(`/api/videos?${q.toString()}`);
  if (!r.ok) throw new Error(`videos ${r.status}`);
  const data = await r.json();
  return (data.items || []) as Video[];
}
