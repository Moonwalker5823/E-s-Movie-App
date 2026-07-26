/** A tiny SVG line chart for a series of numbers (e.g. a roster depth curve or weekly
 *  points once live data flows). Non-focusable, scales to its container width. */
export default function Sparkline({ points, color = "#2bd4ff" }: { points: number[]; color?: string }) {
  if (!points || points.length < 2) return null;
  const w = 240;
  const h = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * (h - 6) - 3}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
