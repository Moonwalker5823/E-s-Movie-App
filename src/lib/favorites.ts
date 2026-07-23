import { useSyncExternalStore } from "react";
import type { FavoriteItem, MediaType, TmdbItem } from "./types";
import { titleOf } from "../api/tmdb";

const KEY = "ema.favorites.v1";

function read(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

let cache: FavoriteItem[] = read();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Sync across tabs
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    cache = read();
    listeners.forEach((l) => l());
  }
});

const idOf = (id: number, list: string) => `${list}:${id}`;

export function isSaved(id: number, list: "favorites" | "watchlist") {
  return cache.some((f) => f.id === id && f.list === list);
}

export function toggleSave(item: TmdbItem, list: "favorites" | "watchlist") {
  const media = (item.media_type || "movie") as MediaType;
  const exists = cache.find((f) => f.id === item.id && f.list === list);
  if (exists) {
    cache = cache.filter((f) => !(f.id === item.id && f.list === list));
  } else {
    cache = [
      {
        id: item.id,
        media_type: media,
        title: titleOf(item),
        poster_path: item.poster_path,
        addedAt: Date.now(),
        list,
      },
      ...cache,
    ];
  }
  emit();
}

export function useFavorites(): FavoriteItem[] {
  return useSyncExternalStore(subscribe, () => cache);
}

export function seedIds(): { id: number; media_type: MediaType }[] {
  // recent favorites first, used to build recommendation rows
  return cache
    .filter((f) => f.list === "favorites")
    .slice(0, 6)
    .map((f) => ({ id: f.id, media_type: f.media_type }));
}

export { idOf };
