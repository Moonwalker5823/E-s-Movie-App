/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme: 80s/90s NYC subway/wall graffiti — wildstyle spray on concrete.
        // These four flip between light/dark via CSS vars (see index.css). The
        // accents below stay fixed — they read on both.
        ink: "rgb(var(--c-ink) / <alpha-value>)", // page bg / concrete wall
        surface: "rgb(var(--c-surface) / <alpha-value>)", // cards
        surface2: "rgb(var(--c-surface2) / <alpha-value>)", // raised cards / inputs
        cream: "rgb(var(--c-cream) / <alpha-value>)", // primary text/foreground
        line: "var(--c-line)", // hairline borders
        gold: "#f5c518", // PRIMARY accent — straight from the portfolio (and movie-poster yellow)
        goldlo: "#c89b0f",
        spray: "#e6392b", // secondary — subway red, now reserved for live/urgent
        sprayhi: "#ff5c47", // bright red-orange highlight
        spraylo: "#a51b0f", // deep oxblood red
        blue: "#1e9bf0", // electric wildstyle blue
        cyan: "#2bd4ff", // ice-blue highlight
        lime: "#9ee520", // green
        yellow: "#ffd400", // classic drip yellow
        orange: "#ff7a1a", // fill/arrow orange
        purple: "#8b3ffb", // pop purple
        live: "#35d07f", // live/status green
      },
      // Lifted from Eric's own portfolio (ea-portfolio-khaki.vercel.app) so the TV app
      // and his work read as one identity: Bebas Neue for display, Barlow Condensed for
      // the letter-spaced kickers, DM Sans for everything you actually read.
      fontFamily: {
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
        tag: ["'Barlow Condensed'", "'Bebas Neue'", "sans-serif"],
        drip: ["'Bebas Neue'", "Impact", "sans-serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(230,57,43,0.5)",
        glowStrong: "0 0 40px rgba(230,57,43,0.65)",
        card: "0 14px 44px rgba(0,0,0,0.65)",
        piece: "5px 5px 0 rgba(0,0,0,0.85)", // hard graffiti drop shadow
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
