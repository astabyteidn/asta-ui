"use client";

import { useState, type KeyboardEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-rating-pop { 0% { transform: scale(1) } 40% { transform: scale(1.3) } 100% { transform: scale(1) } }`;

// A five-point star with softened corners (the stroke rounds them).
const STAR = "M12 3.2l2.6 5.28 5.83.85-4.22 4.11 1 5.8L12 16.5l-5.21 2.74 1-5.8-4.22-4.11 5.83-.85L12 3.2z";

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. */
  max?: number;
  /** Allow half stars (3.5). */
  allowHalf?: boolean;
  /** Clicking the current value again clears it to 0. */
  allowClear?: boolean;
  /** Show the value without letting anyone change it. */
  readOnly?: boolean;
  size?: "sm" | "md";
  /** Accessible name, e.g. "Rate this course". */
  label?: string;
  className?: string;
}

function StarIcon({ fill, preview }: { fill: 0 | 0.5 | 1; preview: boolean }) {
  return (
    <span className="relative block h-full w-full">
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-[color-mix(in_srgb,var(--color-ink)_13%,transparent)]" aria-hidden>
        <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className={cx("absolute inset-0 h-full w-full transition-opacity duration-200", preview ? "text-[color-mix(in_srgb,var(--color-brand)_62%,transparent)]" : "text-brand")}
        style={{ opacity: fill ? 1 : 0, clipPath: fill === 0.5 ? "inset(0 50% 0 0)" : undefined }}
        aria-hidden
      >
        <path d={STAR} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * A star rating. Hover to preview, click to set, and with `allowHalf` the left half of a star sets a half.
 * The filled stars pop one after another when the value changes. Arrow keys step, Home/End jump, digits set.
 */
export function Rating({ value, defaultValue = 0, onChange, max = 5, allowHalf, allowClear = true, readOnly, size = "md", label = "Rating", className }: RatingProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [hover, setHover] = useState<number | null>(null);
  const [pop, setPop] = useState(0);
  const [prev, setPrev] = useState(current);

  // Pop on every change, controlled or not.
  if (prev !== current) {
    setPrev(current);
    setPop((p) => p + 1);
  }

  const step = allowHalf ? 0.5 : 1;
  const px = size === "md" ? 24 : 16;

  // Clearing by picking the current value again is a pointer gesture only. Keys never clear.
  const set = (v: number, click = false) => {
    let next = Math.min(max, Math.max(0, Math.round(v / step) * step));
    if (click && next === current && allowClear && v > 0) next = 0;
    if (next === current) return;
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const at = (e: { currentTarget: HTMLElement; clientX: number }, i: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    return allowHalf && e.clientX - r.left < r.width / 2 ? i + 0.5 : i + 1;
  };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") set(Math.min(max, current + step));
    else if (k === "ArrowLeft" || k === "ArrowDown") set(Math.max(0, current - step));
    else if (k === "Home") set(0);
    else if (k === "End") set(max);
    else if (/^[0-9]$/.test(k) && Number(k) <= max) set(Number(k));
    else return;
    e.preventDefault();
  };

  const shown = hover ?? current;
  const filled = Math.ceil(current);

  const stars = Array.from({ length: max }, (_, i) => {
    const fill: 0 | 0.5 | 1 = shown >= i + 1 ? 1 : shown >= i + 0.5 ? 0.5 : 0;
    return (
      <span
        key={i}
        onPointerMove={readOnly ? undefined : (e) => setHover(at(e, i))}
        onPointerDown={readOnly ? undefined : (e) => e.preventDefault()}
        onClick={readOnly ? undefined : (e) => set(at(e, i), true)}
        className={cx("block shrink-0", !readOnly && "cursor-pointer")}
        style={{ width: px, height: px }}
      >
        <span
          key={pop}
          className={cx("block h-full w-full", pop > 0 && i < filled && "animate-[asta-rating-pop_.42s_cubic-bezier(.16,1,.3,1)_both] motion-reduce:animate-none")}
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <StarIcon fill={fill} preview={hover !== null && hover !== current} />
        </span>
      </span>
    );
  });

  const text = `${current} out of ${max} stars`;

  if (readOnly) {
    return (
      <span role="img" aria-label={`${label}: ${text}`} className={cx("inline-flex items-center", size === "md" ? "gap-1" : "gap-0.5", className)}>
        <style href="asta-rating" precedence="asta">{KEYFRAMES}</style>
        {stars}
      </span>
    );
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={text}
      onKeyDown={onKey}
      onPointerLeave={() => setHover(null)}
      className={cx(
        "inline-flex select-none items-center rounded-md outline-none [touch-action:manipulation] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        size === "md" ? "gap-1" : "gap-0.5",
        className,
      )}
    >
      <style href="asta-rating" precedence="asta">{KEYFRAMES}</style>
      {stars}
    </div>
  );
}

export default Rating;
