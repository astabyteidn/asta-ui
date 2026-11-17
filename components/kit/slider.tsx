"use client";

import { useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Draw a tick for every step (true) or this many evenly spaced ticks. */
  ticks?: boolean | number;
  /** Format the value in the bubble and for screen readers. */
  format?: (v: number) => string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
}

/** A range slider with a value bubble that pops up while you drag, hover or focus it. */
export function Slider({
  value,
  defaultValue = 50,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ticks,
  format = (v) => String(v),
  disabled,
  className,
  ...aria
}: SliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [drag, setDrag] = useState(false);
  const v = value ?? inner;
  const k = (v - min) / (max - min);

  const set = (n: number) => {
    const snapped = Math.min(max, Math.max(min, Math.round((n - min) / step) * step + min));
    const clean = Number(snapped.toFixed(6));
    if (clean === v) return;
    if (value === undefined) setInner(clean);
    onValueChange?.(clean);
  };
  const fromPointer = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    set(min + ((x - r.left) / r.width) * (max - min));
  };

  const marks = ticks === true ? Math.round((max - min) / step) + 1 : typeof ticks === "number" ? ticks : 0;

  return (
    <div className={cx("relative w-full select-none pt-7", disabled && "pointer-events-none opacity-45", className)}>
      <div
        ref={track}
        className="group/sl relative h-6 cursor-pointer touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(true);
          fromPointer(e.clientX);
          (e.currentTarget.querySelector("[role=slider]") as HTMLElement | null)?.focus();
        }}
        onPointerMove={(e) => drag && fromPointer(e.clientX)}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
          <div className={cx("h-full rounded-full bg-accent", !drag && "transition-[width] duration-200 ease-out")} style={{ width: `${k * 100}%` }} />
        </div>
        {marks > 1 && (
          <div aria-hidden className="pointer-events-none absolute inset-x-[3px] top-1/2 -translate-y-1/2">
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
        <div className={cx("absolute top-1/2", !drag && "transition-[left] duration-200 ease-out")} style={{ left: `${k * 100}%` }}>
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={v}
            aria-valuetext={format(v)}
            aria-disabled={disabled || undefined}
            {...aria}
            onKeyDown={(e) => {
              const big = Math.max(step, (max - min) / 10);
              const map: Record<string, number> = {
                ArrowRight: v + step,
                ArrowUp: v + step,
                ArrowLeft: v - step,
                ArrowDown: v - step,
                PageUp: v + big,
                PageDown: v - big,
                Home: min,
                End: max,
              };
              if (e.key in map) {
                e.preventDefault();
                set(map[e.key]);
              }
            }}
            className={cx(
              "peer/th h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white outline-none",
              "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent),0_1px_3px_rgb(0_0_0/0.2),0_4px_10px_-2px_rgb(0_0_0/0.2)]",
              "transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] focus-visible:ring-4 focus-visible:ring-accent/30",
              drag ? "scale-110" : "group-hover/sl:scale-105",
            )}
          />
          <span
            aria-hidden
            className={cx(
              "pointer-events-none absolute bottom-[18px] left-0 origin-bottom -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[12px] font-medium tabular-nums text-paper",
              "shadow-[0_4px_12px_-4px_rgb(0_0_0/0.4)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]",
              drag ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover/sl:scale-100 group-hover/sl:opacity-100 peer-focus-visible/th:scale-100 peer-focus-visible/th:opacity-100",
            )}
          >
            {format(v)}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ink" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default Slider;
