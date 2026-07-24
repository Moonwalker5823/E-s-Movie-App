import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const [show, setShow] = useState(false);
  const nav = useNavigate();
  const { hideX } = useSettings();
  const headerRef = useRef<HTMLElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);

  // The adult "X" tab is appended only when it isn't hidden in Settings.
  const links = hideX ? BASE_LINKS : [...BASE_LINKS, { to: "/x", label: "X" }];

  // Auto-hiding top bar. It stays out of the way (so content — e.g. the Sports hub —
  // sits centered on the TV) and only slides in when you reach for it: pointer at the
  // very top edge, remote/keyboard focus landing on it (press Up from the top row),
  // or a brief peek on first load. Then it tucks itself away again.
  function clearHide() {
    window.clearTimeout(hideTimer.current);
  }
  function hide() {
    const h = headerRef.current;
    // Never yank it away while it's in use (hovered or holding remote/keyboard focus).
    if (h && (h.matches(":hover") || h.contains(document.activeElement))) {
      clearHide();
      hideTimer.current = window.setTimeout(hide, 1200);
      return;
    }
    setShow(false);
  }
  function reveal(sticky = false) {
    clearHide();
    setShow(true);
    if (!sticky) hideTimer.current = window.setTimeout(hide, 2600);
  }

  useEffect(() => {
    reveal(); // peek on load so it's discoverable, then it slides away

    // Mouse: reaching the very top edge brings the bar back. We deliberately do
    // NOT reveal on scroll — D-pad focus navigation scrolls the page to center
    // each row, so a scroll-up trigger made the bar pop in on every Up press. On
    // the remote the bar appears only when focus lands on it (see onFocus below),
    // i.e. when you press Up from the topmost row.
    const onMove = (e: MouseEvent) => {
      if (e.clientY <= 8) reveal();
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearHide();
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header
      ref={headerRef}
      onMouseEnter={() => reveal(true)}
      onMouseLeave={() => reveal(false)}
      onFocus={() => reveal(true)}
      onBlur={() => {
        clearHide();
        hideTimer.current = window.setTimeout(hide, 500);
      }}
      className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl transition-transform duration-300 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
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
