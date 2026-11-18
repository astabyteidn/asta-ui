"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type RangeSliderValue = [number, number];

export interface RangeSliderProps {
  value?: RangeSliderValue;
  defaultValue?: RangeSliderValue;
  onValueChange?: (value: RangeSliderValue) => void;
  /** Fires once when the user lets go (pointer up or a key press). */
  onValueCommit?: (value: RangeSliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  /** The smallest distance the two thumbs keep between them. */
  minGap?: number;
  /** Format the bubbles and the value read to screen readers. */
  format?: (v: number) => string;
  disabled?: boolean;
  /** Form field names for the low and high values. */
  names?: [string, string];
  /** Accessible names for the two thumbs. */
  labels?: [string, string];
  className?: string;
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/**
 * Two thumbs on one track for picking a range. The thumbs never cross and keep `minGap` apart. A value bubble
 * rises over the thumb you drag, hover or focus. Clicks and keys glide, drags follow the pointer exactly.
 */
export function RangeSlider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  minGap = 0,
  format = (v) => String(v),
  disabled,
  names,
  labels = ["Minimum", "Maximum"],
  className,
}: RangeSliderProps) {
  const span = Math.max(0, max - min);
  const gap = Math.min(Math.max(0, minGap), span);
  const dp = Math.max(decimals(step), decimals(min));
  const snap = (v: number) => Number((Math.round((v - min) / step) * step + min).toFixed(dp));

  const [inner, setInner] = useState<RangeSliderValue>(defaultValue ?? [min, max]);
  const raw = value ?? inner;
  const lo = Math.min(max, Math.max(min, raw[0]));
  const hi = Math.min(max, Math.max(lo, raw[1]));
  const current: RangeSliderValue = [lo, hi];

  // The latest value we emitted, so a fast drag never clamps against a stale render.
  const latest = useRef(current);
  useLayoutEffect(() => {
    latest.current = [lo, hi];
  });

  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<(HTMLSpanElement | null)[]>([]);
  const [drag, setDrag] = useState<0 | 1 | null>(null);
  const [hover, setHover] = useState<0 | 1 | null>(null);
  const [focus, setFocus] = useState<0 | 1 | null>(null);

  const set = (i: 0 | 1, v: number) => {
    const [a, b] = latest.current;
    let next: RangeSliderValue;
    if (i === 0) next = [Math.max(min, Math.min(snap(v), b - gap)), b];
    else next = [a, Math.min(max, Math.max(snap(v), a + gap))];
    // Snapping can push a thumb just past the gap. Clamp again without snapping.
    next = [Math.max(min, next[0]), Math.min(max, next[1])];
    if (next[0] === a && next[1] === b) return latest.current;
    latest.current = next;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
    return next;
  };

  const fromX = (x: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || !r.width) return min;
    return min + Math.min(1, Math.max(0, (x - r.left) / r.width)) * span;
  };

  // The press in progress. Drag mode (no glide) only starts on the first real move, so a click glides.
  // When the thumbs sit on top of each other, the first move's direction picks which one you hold.
  const press = useRef<{ id: number; x: number; v: number; i: 0 | 1; tie: boolean; moved: boolean } | null>(null);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    const v = fromX(e.clientX);
    const [a, b] = latest.current;
    const tie = a === b;
    // Nearest thumb. On a tie, the one that can still move (low at max, high at min), else the side you clicked.
    const i: 0 | 1 = tie ? (a >= max ? 0 : a <= min ? 1 : v < a ? 0 : 1) : Math.abs(v - a) < Math.abs(v - b) ? 0 : 1;
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { id: e.pointerId, x: e.clientX, v, i, tie, moved: false };
    if (!tie) set(i, v);
    thumbs.current[i]?.focus();
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    if (!p.moved) {
      const dx = e.clientX - p.x;
      if (Math.abs(dx) < 2) return;
      p.moved = true;
      if (p.tie) {
        p.i = dx < 0 ? 0 : 1;
        thumbs.current[p.i]?.focus();
      }
      setDrag(p.i);
    }
    set(p.i, fromX(e.clientX));
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    // A tap on stacked thumbs moves the default pick (it glides).
    if (!p.moved && p.tie && e.type === "pointerup") set(p.i, p.v);
    setDrag(null);
    onValueCommit?.(latest.current);
  };

  const onKey = (i: 0 | 1) => (e: KeyboardEvent) => {
    const v = latest.current[i];
    const big = Math.max(step, snap(min + span / 10) - min);
    let next: number;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = v + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = v - step;
    else if (e.key === "PageUp") next = v + big;
    else if (e.key === "PageDown") next = v - big;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    else return;
    e.preventDefault();
    const before = latest.current;
    const after = set(i, next);
    if (after !== before) onValueCommit?.(after);
  };

  const pct = (v: number) => (span ? ((v - min) / span) * 100 : 0);
  const glide = drag === null && "transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none";

  return (
    <div className={cx("relative w-full select-none pb-1 pt-9", disabled && "pointer-events-none opacity-50", className)}>
      <div
        ref={track}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative mx-[10px] flex h-5 cursor-pointer items-center [touch-action:none]"
      >
        <span aria-hidden className="absolute inset-x-0 h-1 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]" />
        <span
          aria-hidden
          className={cx("absolute inset-x-0 h-1 origin-left bg-brand", glide)}
          style={{ transform: `translateX(${pct(lo)}%) scaleX(${(pct(hi) - pct(lo)) / 100})` }}
        />
        {current.map((v, idx) => {
          const i = idx as 0 | 1;
          const active = drag === i || hover === i;
          return (
            <span key={i} className={cx("pointer-events-none absolute inset-0", glide)} style={{ transform: `translateX(${pct(v)}%)`, zIndex: drag === i || focus === i ? 2 : 1 }}>
              <span
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={labels[i]}
                aria-valuemin={i === 0 ? min : Math.min(max, lo + gap)}
                aria-valuemax={i === 0 ? Math.max(min, hi - gap) : max}
                aria-valuenow={v}
                aria-valuetext={format(v)}
                aria-orientation="horizontal"
                aria-disabled={disabled || undefined}
                onKeyDown={onKey(i)}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus((f) => (f === i ? null : f))}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                className={cx(
                  "group/th pointer-events-auto absolute left-0 top-1/2 block h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-paper shadow-[0_0_0_1.5px_var(--color-brand),0_2px_6px_-1px_rgb(0_0_0/0.18)] outline-none transition-[scale,box-shadow] duration-200 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:shadow-[0_0_0_1.5px_var(--color-brand),0_0_0_5px_color-mix(in_srgb,var(--color-brand)_22%,transparent)] motion-reduce:transition-none",
                  drag === i ? "scale-110 cursor-grabbing" : "hover:scale-105",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-2 py-1 text-[12px] font-medium tabular-nums leading-none text-paper transition-[opacity,translate] duration-200 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                    active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 group-focus-visible/th:translate-y-0 group-focus-visible/th:opacity-100",
                  )}
                >
                  {format(v)}
                </span>
              </span>
            </span>
          );
        })}
      </div>
      {names && (
        <>
          <input type="hidden" name={names[0]} value={lo} />
          <input type="hidden" name={names[1]} value={hi} />
        </>
      )}
    </div>
  );
}

export default RangeSlider;
