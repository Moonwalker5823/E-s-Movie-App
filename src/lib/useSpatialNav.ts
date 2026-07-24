import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// TV-style D-pad navigation, modeled on Prime Video / Netflix:
//   • Left/Right move WITHIN the current row (elements that vertically overlap).
//   • Up/Down jump to the nearest row in that direction, landing on the element
//     closest to your remembered column (so you stay "in lane").
//   • OK/Enter activates the focused link/button.
//   • The focused element scrolls to a consistent spot; a `.is-focused` ring shows.
// It fully owns the arrow keys (preventDefault) so the WebView never does its own
// focus jumps — that mix was what made it feel like a computer app.

const FOCUSABLE = "[data-focusable]";

function scopeRoot(): ParentNode {
  // A modal (fullscreen video) traps focus to its own subtree.
  return document.querySelector<HTMLElement>("[data-focus-trap]") ?? document;
}
function focusables(): HTMLElement[] {
  return Array.from(scopeRoot().querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
}
function markFocused(el: HTMLElement) {
  document.querySelectorAll(".is-focused").forEach((n) => n !== el && n.classList.remove("is-focused"));
  el.classList.add("is-focused");
}
function isTextField(el: Element | null): boolean {
  const t = (el as HTMLElement | null)?.tagName;
  return t === "INPUT" || t === "TEXTAREA";
}
const cx = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2;
};

export function useSpatialNav() {
  const location = useLocation();
  const columnX = useRef<number | null>(null); // remembered column for up/down

  function goTo(el: HTMLElement, isHorizontal: boolean) {
    markFocused(el);
    el.focus();
    // Column memory updates only on horizontal moves (or first focus).
    if (isHorizontal || columnX.current === null) columnX.current = cx(el);
    el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
  }

  // On each page, land the remote on the featured video ([data-autofocus]) once it
  // loads; until then keep something focused. Never steal focus once the user has
  // moved into page content (a focusable that isn't in the sticky <header> nav).
  useEffect(() => {
    let tries = 0;
    let timer: number;
    const tick = () => {
      const active = document.activeElement as HTMLElement | null;
      const inContent = active && active.matches?.(FOCUSABLE) && !active.closest?.("header");
      if (inContent) return;
      const auto = scopeRoot().querySelector<HTMLElement>("[data-autofocus]");
      if (auto && auto.offsetParent !== null) {
        goTo(auto, true);
        return;
      }
      // Prefer landing on page content, not the auto-hiding top nav — otherwise the
      // bar would hold focus and never tuck away.
      const list = focusables();
      const first = list.find((el) => !el.closest("header")) ?? list[0];
      if ((!active || !active.matches?.(FOCUSABLE)) && first) goTo(first, true);
      if (tries++ < 7) timer = window.setTimeout(tick, 180); // poll ~1.4s for the video
    };
    timer = window.setTimeout(tick, 120);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    function step(key: string): boolean {
      const active = document.activeElement as HTMLElement | null;
      const list = focusables();
      if (!list.length) return false;
      if (!active || !active.matches(FOCUSABLE)) {
        goTo(list[0], true);
        return true;
      }

      const r = active.getBoundingClientRect();
      const ax = r.left + r.width / 2;
      const cands = list.filter((el) => el !== active);

      if (key === "ArrowLeft" || key === "ArrowRight") {
        const dir = key === "ArrowRight" ? 1 : -1;
        // Same-row = vertical overlap with the active element.
        const sameRow = cands.filter((el) => {
          const b = el.getBoundingClientRect();
          const overlaps = b.bottom > r.top + 4 && b.top < r.bottom - 4;
          return overlaps && (dir === 1 ? cx(el) > ax + 1 : cx(el) < ax - 1);
        });
        if (!sameRow.length) return true; // at the row edge — stay put (owns the key)
        const best = sameRow.reduce((a, el) => (Math.abs(cx(el) - ax) < Math.abs(cx(a) - ax) ? el : a));
        goTo(best, true);
        return true;
      }

      // Up / Down: move to the nearest DIFFERENT row. A candidate counts as up/down
      // only if it clears the active element's edge — so items in the SAME row (e.g.
      // sibling nav tabs a couple pixels off) are never treated as up/down. Land on
      // the one closest to the remembered column.
      const dir = key === "ArrowDown" ? 1 : -1;
      const gapOf = (el: HTMLElement) => {
        const b = el.getBoundingClientRect();
        return dir === 1 ? b.top - r.bottom : r.top - b.bottom;
      };
      const inDir = cands.filter((el) => gapOf(el) >= -4);
      if (!inDir.length) return true;
      const minGap = Math.min(...inDir.map(gapOf));
      const nextRow = inDir.filter((el) => gapOf(el) <= minGap + 24); // same rail
      const colX = columnX.current ?? ax;
      const best = nextRow.reduce((a, el) => (Math.abs(cx(el) - colX) < Math.abs(cx(a) - colX) ? el : a));
      goTo(best, false);
      return true;
    }

    function onKey(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;

      if (e.key === "Enter") {
        const trap = document.querySelector("[data-focus-trap]");
        if (trap && active && !trap.contains(active)) {
          e.preventDefault();
          return;
        }
        if (active && active.matches(FOCUSABLE) && !isTextField(active) && active.tagName !== "SELECT") {
          e.preventDefault();
          active.click();
        }
        return;
      }

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      // Text field: keep Left/Right for the cursor; Up/Down move focus out.
      if (isTextField(active) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
      // <select>: let it open/scroll natively.
      if (active?.tagName === "SELECT") return;

      e.preventDefault(); // own the key — no WebView fallback navigation
      step(e.key);
    }

    // Keep the ring + column in sync when focus changes by click/tab/programmatic.
    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement;
      if (t?.matches?.(FOCUSABLE)) {
        markFocused(t);
        columnX.current = cx(t);
      }
    }

    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
