"use client";

import { Slider as S } from "radix-ui";
import { useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (v: number) => void;
  /** Fires once when the user lets go (pointer up or a key press). */
  onValueCommit?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Draw a tick for every step (true) or this many evenly spaced ticks. */
  ticks?: boolean | number;
  /** Format the value in the bubble and for screen readers. */
  format?: (v: number) => string;
  disabled?: boolean;
  /** Form field name. */
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

// The thumb is 20px wide and Radix keeps it inside the track, so its centre runs from 10px to width-10px.
const HALF = 10;

/**
 * A range slider on Radix Slider (pointer, touch, arrows, Page Up/Down, Home/End, ARIA, form value) with a
 * value bubble that pops up while you drag, hover or focus it. Clicks and key presses glide; drags follow
 * the pointer exactly.
 */
export function Slider({
  value,
  defaultValue = 50,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  ticks,
  format = (v) => String(v),
  disabled,
  name,
  className,
  ...aria
}: SliderProps) {
  const [inner, setInner] = useState(defaultValue);
  const [drag, setDrag] = useState(false);
  const v = value ?? inner;
  const k = (v - min) / (max - min);
  const marks = ticks === true ? Math.round((max - min) / step) + 1 : typeof ticks === "number" ? ticks : 0;
  // Only glide when the value jumps (a click on the track or a key), not while dragging.
  const glide = !drag && "[&>span:has(>[role=slider])]:transition-[left] [&>span:has(>[role=slider])]:duration-200 [&>span:has(>[role=slider])]:ease-out";

  return (
    <div className={cx("relative w-full select-none pt-7", className)}>
      <S.Root
        value={[v]}
        onValueChange={([n]) => {
          if (value === undefined) setInner(n);
          onValueChange?.(n);
        }}
        onValueCommit={([n]) => onValueCommit?.(n)}
        onPointerDown={() => setDrag(true)}
        onPointerUp={() => setDrag(false)}
        onLostPointerCapture={() => setDrag(false)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        name={name}
        className={cx("group/sl relative flex h-6 cursor-pointer touch-none items-center data-[disabled]:pointer-events-none data-[disabled]:opacity-45", glide, "motion-reduce:[&>span]:!transition-none")}
      >
        <S.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
          <S.Range className={cx("absolute h-full rounded-full bg-brand", !drag && "transition-[right] duration-200 ease-out motion-reduce:transition-none")} />
        </S.Track>
        {marks > 1 && (
          <div aria-hidden className="pointer-events-none absolute top-1/2 -translate-y-1/2" style={{ left: HALF, right: HALF }}>
            {Array.from({ length: marks }, (_, i) => {
              const at = i / (marks - 1);
              return (
                <span
                  key={i}
                  className={cx("absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors", at <= k ? "bg-white/80" : "bg-[color-mix(in_srgb,var(--color-ink)_28%,transparent)]")}
                  style={{ left: `${at * 100}%` }}
                />
              );
            })}
          </div>
        )}
        <S.Thumb
          {...aria}
          aria-valuetext={format(v)}
          className={cx(
            "group/th relative block h-5 w-5 rounded-full bg-white outline-none",
            "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),0_1px_3px_rgb(0_0_0/0.2),0_4px_10px_-2px_rgb(0_0_0/0.2)]",
            "transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] focus-visible:ring-4 focus-visible:ring-brand/30",
            drag ? "scale-110" : "group-hover/sl:scale-105",
          )}
        >
          <span
            aria-hidden
            className={cx(
              "pointer-events-none absolute bottom-[26px] left-1/2 origin-bottom -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[12px] font-medium tabular-nums text-paper",
              "shadow-[0_4px_12px_-4px_rgb(0_0_0/0.4)] transition-[scale,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
              drag ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover/sl:scale-100 group-hover/sl:opacity-100 group-focus-visible/th:scale-100 group-focus-visible/th:opacity-100",
            )}
          >
            {format(v)}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ink" />
          </span>
        </S.Thumb>
      </S.Root>
    </div>
  );
}

export default Slider;
