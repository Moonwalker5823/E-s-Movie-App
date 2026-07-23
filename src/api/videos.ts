// Client for the /api/videos serverless engine (Sports highlights + Bud TV).
export interface Video {
  videoId: string;
  title: string;
  published: string;
  channel: string;
  thumb: string;
}

export async function videos(set: string): Promise<Video[]> {
  const r = await fetch(`/api/videos?set=${encodeURIComponent(set)}`);
  if (!r.ok) throw new Error(`videos ${r.status}`);
  const data = await r.json();
  return (data.items || []) as Video[];
}
