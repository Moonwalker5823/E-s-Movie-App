/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Theme: 80s/90s NYC graffiti — spray paint on concrete.
        ink: "#141014", // dark concrete wall (page bg)
        surface: "#201a20", // cards
        surface2: "#2b232b", // raised cards / inputs
        line: "rgba(255,255,255,0.12)", // hairline borders
        spray: "#ff2e88", // primary — hot magenta
        sprayhi: "#ff69b4", // bright pink highlight
        spraylo: "#c4006b", // deep magenta
        cyan: "#26e0ff", // secondary accent
        lime: "#b6ff2e", // tertiary accent
        yellow: "#ffe600", // pop accent
        purple: "#9d4edd", // pop accent
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
        glow: "0 0 24px rgba(255,46,136,0.5)",
        glowStrong: "0 0 40px rgba(255,46,136,0.65)",
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
