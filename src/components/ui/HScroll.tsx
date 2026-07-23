import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Horizontal scroll rail with hover arrows. Reused by every poster row. */
export default function HScroll({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 560, behavior: "smooth" });

  return (
    <div className="group/rail relative">
      <button
        aria-label="scroll left"
        onClick={() => scroll(-1)}
        className="absolute left-1 top-[42%] z-10 hidden h-12 w-8 items-center justify-center rounded-full bg-black/70 text-xl text-spray opacity-0 transition group-hover/rail:opacity-100 sm:flex"
      >
        ‹
      </button>
      <button
        aria-label="scroll right"
        onClick={() => scroll(1)}
        className="absolute right-1 top-[42%] z-10 hidden h-12 w-8 items-center justify-center rounded-full bg-black/70 text-xl text-spray opacity-0 transition group-hover/rail:opacity-100 sm:flex"
      >
        ›
      </button>
      <div ref={ref} className={`rail no-scrollbar ${className || ""}`}>
        {children}
      </div>
    </div>
  );
}
