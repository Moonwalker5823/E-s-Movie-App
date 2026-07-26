/** A half-circle gauge (0–1) as a single SVG arc. Non-focusable. */
export default function Gauge({ value, label, color = "#35d07f" }: { value: number; label?: string; color?: string }) {
  const pct = Math.max(0, Math.min(1, value || 0));
  const arc = "M10 62 A52 52 0 0 1 114 62"; // semicircle, r=52
  const len = Math.PI * 52; // arc length
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <svg viewBox="0 0 124 76" className="w-44">
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
        <path
          d={arc}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${len * pct} ${len}`}
        />
        <text x="62" y="56" textAnchor="middle" className="fill-cream font-display" fontSize="22">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <div className="mt-1 text-center text-xs text-cream/50">{label}</div>}
    </div>
  );
}
