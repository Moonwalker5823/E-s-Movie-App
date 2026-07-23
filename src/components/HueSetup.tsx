import { useEffect, useState } from "react";
import { useSettings, setHue, resetHue } from "../lib/settings";
import {
  discoverBridge,
  pair,
  getGroups,
  getScenes,
  applyScene,
  dim,
  bright,
  off,
  type HueGroup,
  type HueScene,
} from "../lib/hue";

/** Pair a Philips Hue bridge and pick the theater room + scenes. */
export default function HueSetup() {
  const { hue } = useSettings();
  const connected = Boolean(hue?.bridgeIp && hue?.user);

  const [ip, setIp] = useState(hue?.bridgeIp || "");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState<HueGroup[]>([]);
  const [scenes, setScenes] = useState<HueScene[]>([]);

  useEffect(() => {
    if (!connected) return;
    getGroups().then(setGroups).catch(() => {});
    getScenes().then(setScenes).catch(() => {});
  }, [connected]);

  const find = async () => {
    setBusy(true);
    setStatus("Searching your network for a Hue bridge…");
    const found = await discoverBridge();
    setBusy(false);
    if (found) {
      setIp(found);
      setHue({ bridgeIp: found });
      setStatus(`Found bridge at ${found}. Press its round link button, then tap Pair.`);
    } else {
      setStatus("Couldn't auto-find a bridge — type its IP manually (Hue app → Settings → My Hue System → your bridge).");
    }
  };

  const doPair = async () => {
    const bridgeIp = ip.trim();
    if (!bridgeIp) {
      setStatus("Enter your bridge IP first (or tap Find).");
      return;
    }
    setHue({ bridgeIp });
    setBusy(true);
    setStatus("Pairing… press the round link button on top of the bridge NOW.");
    const res = await pair(bridgeIp);
    setBusy(false);
    if (res.ok && res.user) {
      setHue({ user: res.user });
      setStatus("✓ Paired! Pick your theater room and scenes below.");
    } else {
      setStatus(res.error || "Pairing failed — press the link button and try again.");
    }
  };

  const forget = () => {
    resetHue();
    setGroups([]);
    setScenes([]);
    setStatus("Disconnected.");
  };

  return (
    <div className="card p-4">
      <p className="text-sm text-cream/70">
        Sync your man-cave lights to the movie. When you hit <b>▶ Play</b>, the app can dim your Hue
        to a theater scene. (Your Hue Sync Box still handles color-follow — this just sets the mood.)
      </p>

      {/* Connect / pair */}
      {!connected ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              data-focusable
              placeholder="Bridge IP (e.g. 192.168.1.42)"
              className="min-w-[12rem] flex-1 rounded-lg border-2 border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-spray/50"
            />
            <button onClick={find} disabled={busy} data-focusable className="btn-ghost !px-3 !py-2 text-xs">
              Find bridge
            </button>
            <button onClick={doPair} disabled={busy} data-focusable className="btn-spray !px-4 !py-2 text-xs">
              Pair
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2 text-sm text-live">
            ✓ Connected to bridge {hue?.bridgeIp}
            <button onClick={forget} data-focusable className="btn-ghost !px-2 !py-1 text-[11px]">
              Disconnect
            </button>
          </div>

          {/* Room */}
          <label className="block">
            <span className="u-label !rotate-0 text-cyan">Theater room</span>
            <select
              value={hue?.groupId || "0"}
              onChange={(e) => setHue({ groupId: e.target.value })}
              data-focusable
              className="mt-1 w-full rounded-lg border-2 border-line bg-surface2 px-3 py-2 text-sm outline-none focus:border-spray/50"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          {/* Scene pickers */}
          {(["play", "movie", "bright"] as const).map((slot) => (
            <label key={slot} className="block">
              <span className="u-label !rotate-0 text-cyan capitalize">
                {slot === "play" ? "Scene on ▶ Play" : `${slot} scene`}
              </span>
              <select
                value={hue?.scenes?.[slot] || ""}
                onChange={(e) => setHue({ scenes: { [slot]: e.target.value } })}
                data-focusable
                className="mt-1 w-full rounded-lg border-2 border-line bg-surface2 px-3 py-2 text-sm outline-none focus:border-spray/50"
              >
                <option value="">{slot === "play" ? "Dim lights (default)" : "— none —"}</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ))}

          {/* Auto-dim toggle */}
          <label className="flex items-center gap-3">
            <button
              onClick={() => setHue({ autoDimOnPlay: !hue?.autoDimOnPlay })}
              data-focusable
              aria-pressed={Boolean(hue?.autoDimOnPlay)}
              className={`grid h-7 w-11 place-items-start rounded-full p-0.5 transition ${
                hue?.autoDimOnPlay ? "bg-live" : "bg-white/15"
              }`}
            >
              <span className={`h-6 w-6 rounded-full bg-cream transition ${hue?.autoDimOnPlay ? "translate-x-4" : ""}`} />
            </button>
            <span className="text-sm text-cream/80">Auto-dim to theater when I hit Play</span>
          </label>

          {/* Test buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => (hue?.scenes?.play ? applyScene(hue.scenes.play) : dim(30))}
              data-focusable
              className="chip"
            >
              ▶ Test Play
            </button>
            <button
              onClick={() => (hue?.scenes?.movie ? applyScene(hue.scenes.movie) : dim(60))}
              data-focusable
              className="chip"
            >
              🎬 Movie
            </button>
            <button onClick={() => bright()} data-focusable className="chip">
              💡 Bright
            </button>
            <button onClick={() => off()} data-focusable className="chip">
              ⏻ Off
            </button>
          </div>
        </div>
      )}

      {status && <p className="mt-3 text-xs text-cream/60">{status}</p>}
      <p className="mt-2 text-[11px] text-cream/40">
        Works in the TV app and on local Wi-Fi. On the public website, browsers block calls to the
        local bridge — that&apos;s expected; use the sideloaded app for lighting.
      </p>
    </div>
  );
}
