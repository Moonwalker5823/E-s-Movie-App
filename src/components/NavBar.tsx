import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/live", label: "Live TV" },
  { to: "/sports", label: "Sports" },
  { to: "/fantasy", label: "Fantasy" },
  { to: "/favorites", label: "My List" },
];

export default function NavBar() {
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-3 sm:px-8">
        <NavLink to="/" className="mr-2 flex items-center gap-2.5">
          <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-lg border-2 border-cyan bg-gradient-to-br from-spraylo to-spray text-lg text-cream shadow-piece">
            ♛
          </span>
          <span className="hidden u-display text-3xl sm:block">
            ERIC&apos;S <span className="u-piece">MOVIES</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-focusable
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-semibold transition sm:px-4 ${
                  isActive ? "bg-spray/15 text-spray" : "text-cream/60 hover:text-cream"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="ml-auto flex items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-focusable
            placeholder="Search movies, TV…"
            className="w-36 rounded-full border border-line bg-white/5 px-4 py-2 text-sm outline-none transition placeholder:text-cream/30 focus:w-56 focus:border-spray/40 focus:bg-white/10 sm:w-52 sm:focus:w-72"
          />
        </form>
      </div>
    </header>
  );
}
