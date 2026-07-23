import { useEffect, useState } from "react";
import { watchProviders } from "../api/tmdb";
import { serviceKeyForProvider } from "./services";
import type { MediaType } from "./types";

// Which streaming services a title can be watched on NOW (subscription / free /
// ads), as service keys. Cached in-memory + persisted with a TTL so scrolling
// My List doesn't refetch TMDB every render.

const MEM = new Map<string, string[]>();
const inflight = new Map<string, Promise<string[]>>();
const LS_KEY = "ema.availability.v1";
const TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

type Persisted = Record<string, { at: number; keys: string[] }>;

function loadDisk(): Persisted {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveDisk(k: string, keys: string[]) {
  try {
    const disk = loadDisk();
    disk[k] = { at: Date.now(), keys };
    localStorage.setItem(LS_KEY, JSON.stringify(disk));
  } catch {
    /* storage full / disabled — cache stays in-memory only */
  }
}

function cached(k: string): string[] | null {
  if (MEM.has(k)) return MEM.get(k)!;
  const hit = loadDisk()[k];
  if (hit && Date.now() - hit.at < TTL) {
    MEM.set(k, hit.keys);
    return hit.keys;
  }
  return null;
}

export async function availabilityFor(media: MediaType, id: number): Promise<string[]> {
  const k = `${media}:${id}`;
  const hit = cached(k);
  if (hit) return hit;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = watchProviders(media, id)
    .then((wp) => {
      const list = [...(wp.flatrate || []), ...(wp.free || []), ...(wp.ads || [])];
      const keys = Array.from(
        new Set(list.map((pr) => serviceKeyForProvider(pr.provider_name)).filter(Boolean) as string[])
      );
      MEM.set(k, keys);
      saveDisk(k, keys);
      inflight.delete(k);
      return keys;
    })
    .catch(() => {
      inflight.delete(k);
      return [] as string[];
    });

  inflight.set(k, p);
  return p;
}

/** React hook: service keys a title is on, or null while loading. */
export function useAvailability(media: MediaType, id: number): string[] | null {
  const [keys, setKeys] = useState<string[] | null>(() => cached(`${media}:${id}`));
  useEffect(() => {
    let alive = true;
    availabilityFor(media, id).then((k) => alive && setKeys(k));
    return () => {
      alive = false;
    };
  }, [media, id]);
  return keys;
}
