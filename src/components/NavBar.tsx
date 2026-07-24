import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSettings } from "../lib/settings";

const BASE_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Browse" },
  { to: "/live", label: "Live TV" },
  { to: "/sports", label: "Sports" },
  { to: "/fantasy", label: "Fantasy" },
  { to: "/games", label: "Games" },
  { to: "/lounge", label: "Lounge" },
  { to: "/music", label: "Music" },
  { to: "/blerd", label: "Blerd" },
  { to: "/favorites", label: "My List" },
];

export default function NavBar() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { hideX } = useSettings();

  // The adult "X" tab is appended only when it isn't hidden in Settings.
  const links = hideX ? BASE_LINKS : [...BASE_LINKS, { to: "/x", label: "X" }];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-3 sm:px-8">
        <NavLink to="/" className="mr-1 flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-lg border-2 border-cyan bg-gradient-to-br from-spraylo to-spray text-lg text-cream shadow-piece">
            ♛
          </span>
          <span className="hidden u-display text-3xl lg:block">
            ERIC&apos;S <span className="u-piece">MOVIES</span>
          </span>
        </NavLink>

        <nav className="no-scrollbar -my-2 flex items-center gap-1 overflow-x-auto py-2 sm:gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-focusable
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
                  isActive ? "bg-spray/15 text-spray" : "text-cream/60 hover:text-cream"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto flex shrink-0 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-focusable
            placeholder="Search movies, TV…"
            className="w-28 rounded-full border border-line bg-white/5 px-4 py-2 text-sm outline-none transition placeholder:text-cream/30 focus:w-48 focus:border-spray/40 focus:bg-white/10 sm:w-44 sm:focus:w-72"
          />
        </form>

        <NavLink
          to="/settings"
          data-focusable
          aria-label="Settings"
          className={({ isActive }) =>
            `grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg transition ${
              isActive ? "bg-spray/15 text-spray" : "text-cream/60 hover:text-cream"
            }`
          }
        >
          ⚙
        </NavLink>
      </div>
    </header>
  );
}
