interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

// A compact page window for a 10-foot UI: 1 … p-1 p p+1 … N.
// Always shows first + last so you can jump to either end with the remote.
function pageWindow(page: number, total: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  const push = (n: number) => out.push(n);
  const window = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = Array.from(window)
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("gap");
    push(n);
    prev = n;
  }
  return out;
}

/**
 * Reusable pagination control — remote-navigable (D-pad focusable) and styled to
 * match the graffiti chip system. Renders nothing for a single page. Used by the
 * Browse-by-Service catalog and anywhere else a paged list needs page controls.
 */
export default function Pagination({ page, totalPages, onChange, className }: Props) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  const arrow = (label: string, to: number, disabled: boolean) =>
    disabled ? (
      <span aria-hidden className="chip cursor-default opacity-30">
        {label}
      </span>
    ) : (
      <button onClick={() => onChange(to)} data-focusable className="chip" aria-label={label === "‹ Prev" ? "Previous page" : "Next page"}>
        {label}
      </button>
    );

  return (
    <nav
      aria-label="Pagination"
      className={`mt-8 flex flex-wrap items-center justify-center gap-2 ${className || ""}`}
    >
      {arrow("‹ Prev", page - 1, atStart)}

      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-cream/60">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            data-focusable
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={`chip min-w-[2.75rem] ${p === page ? "chip-active" : ""}`}
          >
            {p}
          </button>
        )
      )}

      {arrow("Next ›", page + 1, atEnd)}
    </nav>
  );
}
