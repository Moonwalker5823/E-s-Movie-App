import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../lib/settings";

const BASE_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Browse" },
  { to: "/live", label: "Live TV" },
  { to: "/sports", label: "Sports" },
  { to: "/fantasy", label: "Fantasy" },
  { to: "/games", label: "Arcade" },
  { to: "/lounge", label: "Lounge" },
  { to: "/music", label: "Music" },
  { to: "/blerd", label: "Blerd" },
  { to: "/comedy", label: "Comedy" },
  { to: "/favorites", label: "My List" },
];

export default function NavBar() {
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { hideX } = useSettings();

  // The adult "X" tab is appended only when it isn't hidden in Settings.
  const links = hideX ? BASE_LINKS : [...BASE_LINKS, { to: "/x", label: "X" }];

  // Opening the search reveals the input; move the caret (and remote focus) into it.
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      nav(`/search?q=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
    }
  };

  // A plain bar at the very top of the page, above the hero. It scrolls away with
  // the page, so you only see it at the top — scroll up (or press Up from the top
  // row on the remote) to bring it back. No fixed/auto-hiding overlay: that reveal
  // logic read as glitchy on the TV, and D-pad scrolling kept popping it in.
  return (
    <header className="relative z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
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

        {/* Search stays a compact icon until pressed, then expands to an input. */}
        <form onSubmit={submit} className="ml-auto flex shrink-0 items-center">
          {searchOpen ? (
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => !q.trim() && setSearchOpen(false)}
              data-focusable
              placeholder="Search movies, TV…"
              className="w-44 rounded-full border border-line bg-white/10 px-4 py-2 text-sm outline-none transition placeholder:text-cream/30 focus:border-spray/40 sm:w-72"
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              data-focusable
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-cream/60 transition hover:bg-white/10 hover:text-cream"
            >
              🔍
            </button>
          )}
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
