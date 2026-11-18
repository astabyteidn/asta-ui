"use client";

import { useLayoutEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface PaginationProps {
  /** Total number of pages. */
  count: number;
  /** Current page, 1-based. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Pages shown on each side of the current one. */
  siblings?: number;
  /** Pages always shown at the start and end. */
  boundaries?: number;
  size?: "sm" | "md";
  /** Accessible name, e.g. "Orders pages". */
  label?: string;
  className?: string;
}

type Slot = number | "start-gap" | "end-gap";

/** The page numbers to show, with gaps where pages are skipped. A gap never hides just one page. */
export function pageRange(page: number, count: number, siblings = 1, boundaries = 1): Slot[] {
  const total = boundaries * 2 + siblings * 2 + 3;
  const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
  if (count <= total) return range(1, count);
  const left = Math.max(page - siblings, boundaries + 2);
  const right = Math.min(page + siblings, count - boundaries - 1);
  const showStart = left > boundaries + 2;
  const showEnd = right < count - boundaries - 1;
  const head = range(1, boundaries);
  const tail = range(count - boundaries + 1, count);
  if (!showStart) return [...range(1, total - boundaries - 1), "end-gap", ...tail];
  if (!showEnd) return [...head, "start-gap", ...range(count - (total - boundaries - 2), count)];
  return [...head, "start-gap", ...range(left, right), "end-gap", ...tail];
}

const Arrow = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === 1 ? "m6 3.5 4.5 4.5L6 12.5" : "M10 3.5 5.5 8l4.5 4.5"} />
  </svg>
);

/**
 * Page numbers with previous and next. Skipped pages collapse into an ellipsis, and the active marker slides
 * from the old page to the new one. Arrow keys move a page while focus is inside.
 */
export function Pagination({ count, page, defaultPage = 1, onPageChange, siblings = 1, boundaries = 1, size = "md", label = "Pagination", className }: PaginationProps) {
  const [inner, setInner] = useState(defaultPage);
  const pages = Math.max(1, count);
  const current = Math.min(pages, Math.max(1, page ?? inner));
  const list = useRef<HTMLUListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  const go = (n: number) => {
    const next = Math.min(pages, Math.max(1, n));
    if (next === current) return;
    if (page === undefined) setInner(next);
    onPageChange?.(next);
  };

  const slots = pageRange(current, pages, siblings, boundaries);

  // Move the marker under the active button. Page changes slide it, resizes and the first placement snap.
  const place = (animate: boolean) => {
    const btn = list.current?.querySelector<HTMLElement>("[aria-current=page]");
    const m = marker.current;
    if (!btn || !m) return;
    m.style.transition = animate && placed.current ? "" : "none";
    m.style.width = `${btn.offsetWidth}px`;
    m.style.transform = `translateX(${btn.offsetLeft}px)`;
    m.style.opacity = "1";
    placed.current = true;
  };
  const placeRef = useRef(place);
  useLayoutEffect(() => {
    placeRef.current = place;
    place(true);
  });
  useLayoutEffect(() => {
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) first = false;
      else placeRef.current(false);
    });
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, []);

  const h = size === "md" ? "h-9 min-w-9 text-[13.5px]" : "h-8 min-w-8 text-[13px]";
  const btn = cx("relative flex items-center justify-center rounded-lg px-2 tabular-nums outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50", h);

  return (
    <nav
      aria-label={label}
      className={cx("flex items-center gap-1", className)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(current - 1);
        else if (e.key === "ArrowRight") go(current + 1);
        else return;
        e.preventDefault();
        // Keep focus on the active page after the move.
        requestAnimationFrame(() => list.current?.querySelector<HTMLElement>("[aria-current=page]")?.focus());
      }}
    >
      <button type="button" onClick={() => go(current - 1)} disabled={current === 1} aria-label="Previous page" className={cx(btn, "text-ink-2 hover:bg-paper-2 hover:text-ink disabled:pointer-events-none disabled:opacity-35")}>
        <Arrow dir={-1} />
      </button>
      <div className="relative">
        <span
          ref={marker}
          aria-hidden
          className={cx("pointer-events-none absolute left-0 top-0 rounded-lg bg-[color-mix(in_srgb,var(--color-brand)_11%,transparent)] opacity-0 transition-transform duration-[420ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:!transition-none", size === "md" ? "h-9" : "h-8")}
        />
        <ul ref={list} className="flex items-center gap-1">
        {slots.map((s) =>
          typeof s === "number" ? (
            <li key={s}>
              <button
                type="button"
                onClick={() => go(s)}
                aria-current={s === current ? "page" : undefined}
                aria-label={`Page ${s}`}
                className={cx(btn, s === current ? "font-medium text-brand" : "text-ink-2 hover:bg-paper-2 hover:text-ink")}
              >
                {s}
              </button>
            </li>
          ) : (
            <li key={s} aria-hidden className={cx("flex items-center justify-center text-mute", h)}>
              …
            </li>
          ),
        )}
        </ul>
      </div>
      <button type="button" onClick={() => go(current + 1)} disabled={current === pages} aria-label="Next page" className={cx(btn, "text-ink-2 hover:bg-paper-2 hover:text-ink disabled:pointer-events-none disabled:opacity-35")}>
        <Arrow dir={1} />
      </button>
    </nav>
  );
}

export default Pagination;
