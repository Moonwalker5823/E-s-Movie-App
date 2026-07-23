interface Props {
  emoji?: string;
  label?: string; // small tag kicker above the title
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
  accent?: string; // override the auto-picked spray color
}

// Wildstyle palette — each heading gets its own color like pieces on a wall.
const PALETTE = ["#e6392b", "#1e9bf0", "#ffd400", "#9ee520", "#ff7a1a", "#8b3ffb", "#2bd4ff"];

function pickAccent(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Section / page heading — brand display font with a colored spray-stroke underline. */
export default function Heading({ emoji, label, children, size = "lg", className, accent }: Props) {
  const seed = typeof children === "string" ? children : label || String(emoji);
  const color = accent || pickAccent(seed);

  return (
    <div className={className}>
      {label && (
        <div className="u-label mb-1" style={{ color }}>
          {label}
        </div>
      )}
      <h2 className={`u-display ${size === "xl" ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl"}`}>
        {emoji && <span className="mr-2">{emoji}</span>}
        {children}
      </h2>
      <span
        aria-hidden
        className="mt-1.5 block rounded-full"
        style={{
          width: size === "xl" ? "6.5rem" : "3.75rem",
          height: size === "xl" ? "0.5rem" : "0.375rem",
          background: color,
          transform: "rotate(-1.2deg)",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.55)",
        }}
      />
    </div>
  );
}
