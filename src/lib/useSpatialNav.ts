import { useEffect } from "react";

// Lightweight D-pad / arrow-key spatial navigation for TV remotes.
// Moves focus between [data-focusable] elements by on-screen geometry.
export function useSpatialNav() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!keys.includes(e.key)) return;

      const active = document.activeElement as HTMLElement | null;
      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>("[data-focusable]")
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      // If nothing focused yet, focus the first visible one.
      if (!active || !active.matches("[data-focusable]")) {
        focusables[0].focus();
        e.preventDefault();
        return;
      }

      const a = active.getBoundingClientRect();
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2;

      let best: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const el of focusables) {
        if (el === active) continue;
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const dx = x - ax;
        const dy = y - ay;

        let ok = false;
        if (e.key === "ArrowRight") ok = dx > 8 && Math.abs(dy) < Math.abs(dx) + 60;
        if (e.key === "ArrowLeft") ok = dx < -8 && Math.abs(dy) < Math.abs(dx) + 60;
        if (e.key === "ArrowDown") ok = dy > 8 && Math.abs(dx) < Math.abs(dy) + 200;
        if (e.key === "ArrowUp") ok = dy < -8 && Math.abs(dx) < Math.abs(dy) + 200;
        if (!ok) continue;

        // Prefer the closest in the primary direction.
        const primary = e.key === "ArrowLeft" || e.key === "ArrowRight" ? Math.abs(dx) : Math.abs(dy);
        const secondary = e.key === "ArrowLeft" || e.key === "ArrowRight" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }

      if (best) {
        best.focus();
        best.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
