"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const EASE = "cubic-bezier(.16,1,.3,1)";

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, state: { index: number; dragging: boolean }) => ReactNode;
  /** Accessible name of the list. */
  label: string;
  /** Text used in announcements. Defaults to the id. */
  getLabel?: (item: T) => string;
  className?: string;
}

interface Drag {
  id: string;
  from: number;
  to: number;
  startY: number;
  tops: number[];
  heights: number[];
  gap: number;
}

const move = <T,>(list: T[], from: number, to: number) => {
  const next = list.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

const Grip = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
    {[4, 8, 12].flatMap((y) => [6, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.15" />))}
  </svg>
);

/**
 * A list you put in order. Drag a row by its handle and the others slide aside to open a gap where it will
 * land. With the keyboard, Space picks a row up, the arrows move it and Space drops it (Escape puts it back).
 * Every move is announced, and rows glide to their new places instead of jumping.
 */
export function SortableList<T extends { id: string }>({ items, onReorder, renderItem, label, getLabel = (it) => it.id, className }: SortableListProps<T>) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [say, setSay] = useState("");
  const rows = useRef(new Map<string, HTMLLIElement>());
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const flip = useRef<Map<string, number> | null>(null);
  const before = useRef<T[] | null>(null);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /** Remember where every row is drawn now, so the next layout can glide from there. */
  const snapshot = () => {
    const m = new Map<string, number>();
    rows.current.forEach((el, id) => m.set(id, el.getBoundingClientRect().top));
    flip.current = m;
  };

  useLayoutEffect(() => {
    const m = flip.current;
    if (!m) return;
    flip.current = null;
    if (reduce.current) return;
    rows.current.forEach((el, id) => {
      const old = m.get(id);
      if (old === undefined) return;
      const d = old - el.getBoundingClientRect().top;
      if (Math.abs(d) > 0.5) el.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 320, easing: EASE });
    });
    if (grabbed) handles.current.get(grabbed)?.focus();
  }, [items, grabbed]);

  const name = (id: string) => {
    const it = items.find((x) => x.id === id);
    return it ? getLabel(it) : id;
  };

  // ---- Pointer ----
  const onDown = (e: PointerEvent<HTMLButtonElement>, id: string, index: number) => {
    if (e.button !== 0 || grabbed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const els = items.map((it) => rows.current.get(it.id)!);
    const tops = els.map((el) => el.offsetTop);
    const heights = els.map((el) => el.offsetHeight);
    const gap = els.length > 1 ? tops[1] - tops[0] - heights[0] : 0;
    setDrag({ id, from: index, to: index, startY: e.clientY, tops, heights, gap });
    setSay(`Picked up ${name(id)}.`);
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const el = rows.current.get(drag.id);
    if (el) el.style.transform = `translateY(${dy}px) scale(1.015)`;
    const center = drag.tops[drag.from] + drag.heights[drag.from] / 2 + dy;
    let to = drag.from;
    drag.tops.forEach((t, i) => {
      const mid = t + drag.heights[i] / 2;
      if (i > drag.from && center > mid) to = i;
      if (i < drag.from && center < mid && i < to) to = i;
    });
    if (to !== drag.to) setDrag({ ...drag, to });
  };
  const onUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const el = rows.current.get(drag.id);
    setDrag(null);
    if (drag.to !== drag.from) {
      snapshot();
      if (el) el.style.transform = "";
      onReorder(move(items, drag.from, drag.to));
      setSay(`${name(drag.id)} dropped at position ${drag.to + 1} of ${items.length}.`);
      return;
    }
    // Same place: glide back from wherever it was let go.
    if (el) {
      el.style.transform = "";
      const dy = e.clientY - drag.startY;
      if (!reduce.current && Math.abs(dy) > 0.5) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 320, easing: EASE });
    }
    setSay(`${name(drag.id)} dropped. Position unchanged.`);
  };

  // ---- Keyboard ----
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, id: string, index: number) => {
    const n = items.length;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (grabbed) {
        setGrabbed(null);
        before.current = null;
        setSay(`${name(id)} dropped at position ${index + 1} of ${n}.`);
      } else {
        setGrabbed(id);
        before.current = items;
        setSay(`Picked up ${name(id)}, position ${index + 1} of ${n}. Use the up and down arrows to move it, Space to drop, Escape to cancel.`);
      }
    } else if (grabbed === id && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const to = Math.max(0, Math.min(n - 1, index + (e.key === "ArrowUp" ? -1 : 1)));
      if (to === index) return;
      snapshot();
      onReorder(move(items, index, to));
      setSay(`${name(id)} moved to position ${to + 1} of ${n}.`);
    } else if (grabbed === id && e.key === "Escape") {
      e.preventDefault();
      if (before.current) {
        snapshot();
        onReorder(before.current);
      }
      before.current = null;
      setGrabbed(null);
      setSay(`Cancelled. ${name(id)} is back where it was.`);
    }
  };

  const shiftFor = (i: number) => {
    if (!drag || i === drag.from) return 0;
    const h = drag.heights[drag.from] + drag.gap;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -h;
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return h;
    return 0;
  };

  return (
    <div className={className}>
      <ul aria-label={label} className="flex flex-col gap-1.5">
        {items.map((it, i) => {
          const dragging = drag?.id === it.id;
          const lifted = dragging || grabbed === it.id;
          const shift = shiftFor(i);
          return (
            <li
              key={it.id}
              ref={(el) => {
                if (el) rows.current.set(it.id, el);
                else rows.current.delete(it.id);
              }}
              style={dragging ? undefined : { transform: shift ? `translateY(${shift}px)` : undefined, transition: drag ? `transform .28s ${EASE}` : undefined }}
              className={cx(
                "relative flex items-center gap-2 rounded-[11px] bg-paper py-2 pl-1.5 pr-3",
                "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-shadow duration-200",
                lifted && "z-10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_55%,transparent),0_14px_30px_-14px_rgb(0_0_0/0.35)]",
              )}
            >
              <button
                ref={(el) => {
                  if (el) handles.current.set(it.id, el);
                  else handles.current.delete(it.id);
                }}
                type="button"
                aria-label={`Reorder ${getLabel(it)}`}
                aria-pressed={grabbed === it.id}
                onPointerDown={(e) => onDown(e, it.id, i)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onKeyDown={(e) => onKey(e, it.id, i)}
                onBlur={() => {
                  if (grabbed === it.id && !flip.current) {
                    setGrabbed(null);
                    before.current = null;
                  }
                }}
                className={cx(
                  "flex h-8 w-7 shrink-0 touch-none items-center justify-center rounded-md outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand/50",
                  dragging ? "cursor-grabbing text-ink" : "cursor-grab text-mute hover:bg-paper-2 hover:text-ink",
                  grabbed === it.id && "bg-brand text-white hover:bg-brand hover:text-white",
                )}
              >
                <Grip />
              </button>
              <div className="min-w-0 flex-1">{renderItem(it, { index: i, dragging: lifted })}</div>
            </li>
          );
        })}
      </ul>
      <p aria-live="assertive" className="sr-only">
        {say}
      </p>
    </div>
  );
}

export default SortableList;
