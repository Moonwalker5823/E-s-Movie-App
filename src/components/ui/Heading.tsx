interface Props {
  emoji?: React.ReactNode; // an emoji string OR a custom icon element
  label?: string; // small tag kicker above the title
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
  accent?: string; // override the auto-picked spray color
}

// One accent, everywhere. This used to hash the heading text into a 7-color palette so
// every section came out a different color — which is a big part of why the app read as
// unorganized: two headings on one screen rarely agreed. Gold is the identity now, and
// a caller that genuinely needs another color still passes `accent`.
const ACCENT = "#f5c518";

/** Section / page heading — brand display font with a colored spray-stroke underline. */
export default function Heading({ emoji, label, children, size = "lg", className, accent }: Props) {
  const color = accent || ACCENT;

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
        className="mt-2 block"
        /* Trimmed from a 6px tilted slab with a hard drop shadow. The TV viewport is
           only 540px tall — every pixel above the player is one the video doesn't get —
           and at this weight it reads as a deliberate rule instead of a sticker. */
        style={{
          width: size === "xl" ? "4.5rem" : "2.5rem",
          height: size === "xl" ? "0.3rem" : "0.22rem",
          background: color,
          borderRadius: "999px",
        }}
      />
    </div>
  );
}
