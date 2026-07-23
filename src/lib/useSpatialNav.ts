import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// D-pad / arrow-key spatial navigation for TV remotes.
// - Arrow keys move focus between [data-focusable] elements by on-screen geometry.
// - OK / Enter activates the focused link or button (the "click" the remote sends).
// - A visible `.is-focused` ring is kept in sync (programmatic focus doesn't always
//   trigger :focus-visible inside TV WebViews, so we drive the class ourselves).
// - Text inputs keep normal Left/Right/Up cursor behavior; only Down jumps out.

const FOCUSABLE = "[data-focusable]";

function visibleFocusables(): HTMLElement[] {
  // While a modal focus-trap is open (e.g. the fullscreen video overlay), only
  // its descendants are reachable — the remote can't wander onto the nav behind it.
  const trap = document.querySelector<HTMLElement>("[data-focus-trap]");
  const scope: ParentNode = trap ?? document;
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
}

function markFocused(el: HTMLElement) {
  document.querySelectorAll(".is-focused").forEach((n) => n !== el && n.classList.remove("is-focused"));
  el.classList.add("is-focused");
}

function moveTo(el: HTMLElement) {
  markFocused(el);
  el.focus();
  el.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}

function isTextField(el: Element | null): boolean {
  const tag = (el as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

export function useSpatialNav() {
  const location = useLocation();

  // Prime the remote: focus the first control when nothing focusable is focused
  // (fresh load, or after the previously focused element unmounted on navigation).
  // If the user already has something focused (e.g. the nav link they just OK'd),
  // leave it alone.
  useEffect(() => {
    const t = setTimeout(() => {
      const active = document.activeElement;
      if (active && active.matches?.(FOCUSABLE)) return;
      const list = visibleFocusables();
      if (list.length) moveTo(list[0]);
    }, 120);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;

      // OK / Enter → activate the focused link/button. Let text fields submit their
      // form and let <select> open its options natively.
      if (e.key === "Enter") {
        const trap = document.querySelector("[data-focus-trap]");
        if (trap && active && !trap.contains(active)) {
          e.preventDefault(); // don't activate anything behind an open modal
          return;
        }
        if (active && active.matches(FOCUSABLE) && !isTextField(active) && active.tagName !== "SELECT") {
          e.preventDefault();
          active.click();
        }
        return;
      }

      const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrows.includes(e.key)) return;

      // Inside a text field, keep Left/Right for the cursor, but let Up/Down move
      // focus out so you can never get stuck on an input (common on the TV remote).
      if (isTextField(active) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
      // Inside a <select>, let the remote scroll options.
      if (active?.tagName === "SELECT") return;

      const focusables = visibleFocusables();
      if (focusables.length === 0) return;

      if (!active || !active.matches(FOCUSABLE)) {
        moveTo(focusables[0]);
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

        const primary = e.key === "ArrowLeft" || e.key === "ArrowRight" ? Math.abs(dx) : Math.abs(dy);
        const secondary = e.key === "ArrowLeft" || e.key === "ArrowRight" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }

      if (best) {
        moveTo(best);
        e.preventDefault();
      }
    }

    // Keep the ring in sync when focus changes by other means (click, tab, focus()).
    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement;
      if (t?.matches?.(FOCUSABLE)) markFocused(t);
    }

    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
