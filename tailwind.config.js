/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme: 80s/90s NYC subway/wall graffiti — wildstyle spray on concrete.
        ink: "#141013", // dark warm concrete wall (page bg)
        surface: "#1e1a1c", // cards
        surface2: "#2a2427", // raised cards / inputs
        line: "rgba(255,255,255,0.12)", // hairline borders
        spray: "#e6392b", // primary — true subway red
        sprayhi: "#ff5c47", // bright red-orange highlight
        spraylo: "#a51b0f", // deep oxblood red
        blue: "#1e9bf0", // electric wildstyle blue
        cyan: "#2bd4ff", // ice-blue highlight
        lime: "#9ee520", // green
        yellow: "#ffd400", // classic drip yellow
        orange: "#ff7a1a", // fill/arrow orange
        purple: "#8b3ffb", // pop purple
        cream: "#f6f2ea", // paint-white text
        live: "#35d07f", // live/status green
      },
      fontFamily: {
        display: ["Bangers", "Impact", "sans-serif"], // loud piece lettering
        tag: ["'Permanent Marker'", "cursive"], // marker tags / labels
        drip: ["'Rubik Wet Paint'", "Bangers", "cursive"], // dripping accent
        body: ["Inter", "system-ui", "sans-serif"],
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
