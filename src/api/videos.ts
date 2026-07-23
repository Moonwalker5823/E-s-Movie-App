// Client for the /api/videos serverless engine (Sports highlights, Bud TV, Blerd, Games).
export interface Video {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
  durationSec?: number;
}

/** `short: true` asks the engine for clips 5 min and under (shorts-only tabs). */
export async function videos(set: string, opts: { short?: boolean } = {}): Promise<Video[]> {
  const q = new URLSearchParams({ set });
  if (opts.short) q.set("short", "1");
  const r = await fetch(`/api/videos?${q.toString()}`);
  if (!r.ok) throw new Error(`videos ${r.status}`);
  const data = await r.json();
  return (data.items || []) as Video[];
}
