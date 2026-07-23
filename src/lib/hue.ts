// Minimal Philips Hue v1 local-API client for theater lighting.
//
// The user's Hue Sync Box already handles real-time color-follow, so this only
// triggers SCENES / dimming (e.g. dim to a movie scene when you hit Play).
// Everything is best-effort: Hue is ambiance, so a missing/unreachable bridge
// must never block the app. All control calls swallow errors.
//
// Note on mixed content: the bridge speaks HTTP on the LAN, so calls are blocked
// from the deployed HTTPS site in a normal browser. They work in local dev (HTTP)
// and in the native Android TV app (mixed content allowed) — the man-cave target.

import { getSettings } from "./settings";

const TIMEOUT = 4000;

async function withTimeout(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function base(): string | null {
  const ip = getSettings().hue?.bridgeIp;
  return ip ? `http://${ip}/api` : null;
}

/** Ask Philips' discovery service for a bridge on this network. */
export async function discoverBridge(): Promise<string | null> {
  try {
    const list = await withTimeout("https://discovery.meethue.com/");
    return list?.[0]?.internalipaddress || null;
  } catch {
    return null;
  }
}

/** Press the physical link button on the bridge FIRST, then call this. */
export async function pair(bridgeIp: string): Promise<{ ok: boolean; user?: string; error?: string }> {
  try {
    const data = await withTimeout(`http://${bridgeIp}/api`, {
      method: "POST",
      body: JSON.stringify({ devicetype: "erics_movie_app#tv" }),
    });
    const user = data?.[0]?.success?.username as string | undefined;
    if (user) return { ok: true, user };
    return { ok: false, error: data?.[0]?.error?.description || "Press the bridge's link button, then try again." };
  } catch {
    return { ok: false, error: "Bridge unreachable — check the IP and that you're on the same Wi-Fi." };
  }
}

export interface HueGroup {
  id: string;
  name: string;
}
export interface HueScene {
  id: string;
  name: string;
  group?: string;
}

export async function getGroups(): Promise<HueGroup[]> {
  const b = base();
  const user = getSettings().hue?.user;
  if (!b || !user) return [];
  try {
    const data = await withTimeout(`${b}/${user}/groups`);
    const groups = Object.entries(data || {}).map(([id, g]: [string, any]) => ({ id, name: g?.name || id }));
    return [{ id: "0", name: "All lights" }, ...groups];
  } catch {
    return [];
  }
}

export async function getScenes(): Promise<HueScene[]> {
  const b = base();
  const user = getSettings().hue?.user;
  if (!b || !user) return [];
  try {
    const data = await withTimeout(`${b}/${user}/scenes`);
    return Object.entries(data || {}).map(([id, s]: [string, any]) => ({ id, name: s?.name || id, group: s?.group }));
  } catch {
    return [];
  }
}

// Fire-and-forget action on the configured group ("0" = all lights).
async function action(body: Record<string, unknown>) {
  const b = base();
  const { user, groupId } = getSettings().hue || {};
  if (!b || !user) return;
  try {
    await withTimeout(`${b}/${user}/groups/${groupId || "0"}/action`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  } catch {
    /* ambiance only — ignore */
  }
}

export const applyScene = (sceneId: string) => action({ scene: sceneId });
export const dim = (bri = 40) => action({ on: true, bri });
export const bright = () => action({ on: true, bri: 254 });
export const off = () => action({ on: false });

/** Called when the user hits Play: dims to the theater scene if enabled. */
export function theaterOnPlay() {
  const hue = getSettings().hue;
  if (!hue?.user || !hue.autoDimOnPlay) return;
  return hue.scenes?.play ? applyScene(hue.scenes.play) : dim(30);
}

export function hueConnected(): boolean {
  const hue = getSettings().hue;
  return Boolean(hue?.bridgeIp && hue?.user);
}
