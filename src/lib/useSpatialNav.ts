import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

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
  const navType = useNavigationType(); // PUSH / REPLACE (forward) vs POP (back/forward)
  const columnX = useRef<number | null>(null); // remembered column for up/down
  const lastFocused = useRef<HTMLElement | null>(null); // last focused element (resume after unmount)
  const lastRect = useRef<DOMRect | null>(null); // where focus last was (position resume)
  const scrollMem = useRef<Map<string, number>>(new Map()); // scrollY per history entry
  const currentKey = useRef(location.key); // the entry we're currently on (for the scroll saver)

  // Continuously remember how far we've scrolled on THIS history entry, so pressing
  // Back later can drop us right where we were (not up at the hero).
  useEffect(() => {
    const onScroll = () => scrollMem.current.set(currentKey.current, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(el: HTMLElement, isHorizontal: boolean, gentle = false) {
    markFocused(el);
    el.focus({ preventScroll: gentle });
    // Column memory updates only on horizontal moves (or first focus).
    if (isHorizontal || columnX.current === null) columnX.current = cx(el);
    // "gentle" (initial page focus) only scrolls if the target is off-screen, so a
    // page opens at the TOP (nav + heading visible) instead of jumping down to
    // center the first control. Arrow-key moves still center the focused element.
    el.scrollIntoView({ block: gentle ? "nearest" : "center", inline: gentle ? "nearest" : "center", behavior: "smooth" });
  }

  // On each page, land the remote on the featured video ([data-autofocus]) once it
  // loads; until then keep something focused. Never steal focus once the user has
  // moved into page content (a focusable that isn't in the sticky <header> nav).
  useEffect(() => {
    currentKey.current = location.key;
    const saved = scrollMem.current.get(location.key);
    // On Back/Forward (POP) return to where we were; on a fresh navigation open at the
    // top so the nav + heading are visible.
    const restoring = navType === "POP" && typeof saved === "number" && saved > 0;
    window.scrollTo(0, restoring ? saved! : 0);

    let tries = 0;
    let timer: number;
    const tick = () => {
      // While restoring, the page keeps growing as async content loads — re-pin to the
      // saved spot until it sticks (or the page can't get that tall), and hold off on
      // grabbing focus so we don't land on a pre-content element.
      if (restoring) {
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        if (Math.abs(window.scrollY - saved!) > 4 && maxY >= saved! - 4) window.scrollTo(0, saved!);
        const settled = Math.abs(window.scrollY - saved!) <= 4 || maxY < saved! - 4;
        if (!settled && tries++ < 16) {
          timer = window.setTimeout(tick, 120);
          return;
        }
      }

      const active = document.activeElement as HTMLElement | null;
      const inContent = active && active.matches?.(FOCUSABLE) && !active.closest?.("header");
      if (inContent) return;

      const auto = scopeRoot().querySelector<HTMLElement>("[data-autofocus]");
      if (auto && auto.offsetParent !== null && !restoring) {
        goTo(auto, true, true);
        return;
      }

      const list = focusables().filter((el) => !el.closest("header"));
      let first: HTMLElement | undefined = list[0];
      if (restoring && list.length) {
        // Land the ring on the on-screen item nearest the viewport middle, so the
        // D-pad resumes right where the user was — not up at the first title.
        const mid = window.innerHeight / 2;
        const dist = (el: HTMLElement) => {
          const b = el.getBoundingClientRect();
          return Math.abs(b.top + b.height / 2 - mid);
        };
        const onScreen = list.filter((el) => {
          const b = el.getBoundingClientRect();
          return b.bottom > 0 && b.top < window.innerHeight;
        });
        if (onScreen.length) first = onScreen.reduce((a, el) => (dist(el) < dist(a) ? el : a));
      }
      if ((!active || !active.matches?.(FOCUSABLE)) && first) goTo(first, true, true);
      if (tries++ < 7) timer = window.setTimeout(tick, 180); // poll ~1.4s for late content
    };
    timer = window.setTimeout(tick, 120);
    return () => clearTimeout(timer);
  }, [location.key, navType]);

  useEffect(() => {
    function step(key: string): boolean {
      const active = document.activeElement as HTMLElement | null;
      const list = focusables();
      if (!list.length) return false;
      if (!active || !active.matches(FOCUSABLE)) {
        // Focus fell to <body> (the focused element unmounted after an action, or a
        // modal closed). Resume where the user was — the last-focused element if it
        // survives, else the nearest surviving focusable to its old spot — so a D-pad
        // press doesn't teleport up to the top nav.
        const last = lastFocused.current;
        if (last && last.isConnected && last.offsetParent !== null && last.matches(FOCUSABLE)) {
          goTo(last, true);
          return true;
        }
        const rect = lastRect.current;
        let target = list[0];
        if (rect) {
          let nearest = Infinity;
          for (const el of list) {
            const b = el.getBoundingClientRect();
            const d = Math.hypot(b.left - rect.left, b.top - rect.top);
            if (d < nearest) {
              nearest = d;
              target = el;
            }
          }
        }
        goTo(target, true);
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
      // Text field: keep Left/Right for the caret ONLY while it can still move; at the
      // field's edge fall through to step() so focus can leave. Otherwise the search box
      // is a horizontal dead-end that traps the remote before the ⚙ gear beyond it.
      if (isTextField(active) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const inp = active as HTMLInputElement;
        const s = inp.selectionStart ?? 0;
        const en = inp.selectionEnd ?? 0;
        const canMove =
          e.key === "ArrowLeft" ? !(s === 0 && en === 0) : !(s === inp.value.length && en === inp.value.length);
        if (canMove) return; // caret still has room — keep it native
      }
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
        lastFocused.current = t;
        lastRect.current = t.getBoundingClientRect();
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
