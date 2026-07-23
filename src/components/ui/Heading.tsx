interface Props {
  emoji?: string;
  label?: string; // small mono kicker above the title
  children: React.ReactNode;
  size?: "lg" | "xl";
  className?: string;
}

/** Section / page heading in the brand display font. */
export default function Heading({ emoji, label, children, size = "lg", className }: Props) {
  return (
    <div className={className}>
      {label && <div className="u-label mb-1">{label}</div>}
      <h2 className={`u-display ${size === "xl" ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl"}`}>
        {emoji && <span className="mr-2">{emoji}</span>}
        {children}
      </h2>
    </div>
  );
}
