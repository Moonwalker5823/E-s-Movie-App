import { useState } from "react";
import Heading from "../components/ui/Heading";
import { STREAMING_SERVICES, FANTASY_SITES } from "../lib/services";
import { useSettings, setLanding, toggleService, setLeague } from "../lib/settings";

function clearKey(key: string, label: string) {
  if (!confirm(`Clear ${label}? This can't be undone.`)) return;
  localStorage.removeItem(key);
  location.reload();
}

export default function Settings() {
  const s = useSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8">
      <Heading label="♛ Settings" emoji="⚙️" size="xl">
        Setup &amp; Connections
      </Heading>

      {/* Security note */}
      <p className="mt-3 rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-sm text-cream/80">
        🔒 Sign-in happens on each service&apos;s <b>own</b> site — this app never sees your passwords
        and <b>can&apos;t detect</b> your real login status (that stays private on each service). These
        toggles are simply <b>you</b> telling the app which services you&apos;re signed into on your TV,
        so it can flag what you can watch for free.
      </p>

      {/* General */}
      <section className="mt-8">
        <Heading emoji="🎛️" className="mb-3">General</Heading>
        <div className="card p-4">
          <div className="mb-2 u-label !rotate-0 text-cyan">Default landing page</div>
          <div className="flex gap-2">
            {(["home", "browse"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanding(l)}
                data-focusable
                className={`chip ${s.landing === l ? "chip-active" : ""}`}
              >
                {l === "home" ? "Home" : "Browse / All Free"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* My Services */}
      <section className="mt-8">
        <Heading emoji="📺" className="mb-3">My Services</Heading>
        <p className="mb-3 text-sm text-cream/50">
          Turn on the services you&apos;re signed into on your TV. Connected ones are dimmed with a
          ✓ — tap <b>Open</b> to jump straight in.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {STREAMING_SERVICES.map((svc) => {
            const owned = s.myServices.includes(svc.key);
            return (
              <div
                key={svc.key}
                className={`card flex items-center gap-3 p-3 transition ${owned ? "opacity-60" : ""}`}
                style={owned ? { boxShadow: "inset 4px 0 0 #35d07f" } : undefined}
              >
                <button
                  onClick={() => toggleService(svc.key)}
                  data-focusable
                  aria-pressed={owned}
                  title={owned ? "Turn off" : "Mark as signed in"}
                  className={`grid h-7 w-11 place-items-start rounded-full p-0.5 transition ${
                    owned ? "bg-live" : "bg-white/15"
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full bg-cream transition ${owned ? "translate-x-4" : ""}`} />
                </button>
                <div className="flex-1">
                  <div className="font-semibold text-cream">
                    {svc.name}
                    {svc.free ? " · FREE" : ""}
                  </div>
                  <div className={`text-xs ${owned ? "text-live" : "text-cream/40"}`}>
                    {owned ? "✓ Signed in" : "Not connected"}
                  </div>
                </div>
                <a href={svc.loginUrl} target="_blank" rel="noreferrer" data-focusable className="btn-ghost !px-3 !py-1 text-xs">
                  {owned ? "Open ↗" : "Sign in ↗"}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fantasy leagues */}
      <section className="mt-8">
        <Heading emoji="🏈" className="mb-3">Fantasy Leagues</Heading>
        <p className="mb-3 text-sm text-cream/50">
          Paste your league link so you can jump straight to it. You log in on Yahoo/ESPN.
        </p>
        <div className="space-y-3">
          {FANTASY_SITES.map((f) => (
            <LeagueRow key={f.key} which={f.key as "yahoo" | "espn"} name={f.name} loginUrl={f.loginUrl} saved={s.leagues[f.key as "yahoo" | "espn"]} />
          ))}
        </div>
      </section>

      {/* Data */}
      <section className="mt-8">
        <Heading emoji="🗑️" className="mb-3">Data</Heading>
        <div className="card flex flex-wrap gap-2 p-4">
          <button onClick={() => clearKey("ema.favorites.v1", "Favorites & Watchlist")} data-focusable className="btn-ghost">
            Clear Favorites & Watchlist
          </button>
          <button onClick={() => clearKey("ema.draft.v1", "your draft")} data-focusable className="btn-ghost">
            Clear Draft
          </button>
        </div>
        <p className="mt-2 text-xs text-cream/40">All your data lives only in this browser — nothing is uploaded.</p>
      </section>
    </div>
  );
}

function LeagueRow({ which, name, loginUrl, saved }: { which: "yahoo" | "espn"; name: string; loginUrl: string; saved?: string }) {
  const [url, setUrl] = useState(saved || "");
  return (
    <div className="card flex flex-wrap items-center gap-3 p-3">
      <span className="w-28 font-semibold text-cream">{name}</span>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={() => setLeague(which, url.trim())}
        data-focusable
        placeholder="Paste your league URL…"
        className="min-w-[12rem] flex-1 rounded-lg border-2 border-line bg-white/5 px-3 py-2 text-sm outline-none focus:border-spray/50"
      />
      <a href={saved || loginUrl} target="_blank" rel="noreferrer" data-focusable className="btn-spray !px-3 !py-1 text-xs">
        Open ↗
      </a>
    </div>
  );
}
