"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui061-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui061 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui061-rise .6s ${EASE} ${80 + i * 55}ms both` });

// Thumb is 22px. Its centre runs from HALF to width - HALF.
const HALF = 11;

function Roll({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span className="inline-flex tabular-nums" aria-hidden>
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={chars.length - i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionTimingFunction: EASE }}>
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="block h-[1em] text-center leading-[1em]">
                  {n}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`c${chars.length - i}`} className="leading-[1em]">
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

export interface BubbleSliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (v: number) => void;
  onValueCommit?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

const money = (v: number) => `$${v.toLocaleString("en-US")}`;

/**
 * aui-061 · A budget slider with a value bubble riding on the thumb. Signature: the bubble tilts with the speed
 * of your drag and its digits roll, while the reach estimate rolls along underneath.
 */
export function BubbleSlider({ value, defaultValue = 2400, onValueChange, onValueCommit, min = 0, max = 10000, step = 100, format = money, label = "Monthly budget", disabled, name, className }: BubbleSliderProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const v = value ?? inner;
  const k = (v - min) / (max - min);
  const [drag, setDrag] = useState(false);
  const [tilt, setTilt] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const box = useRef<{ left: number; width: number } | null>(null);
  const lastX = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(settle.current), []);

  const set = (n: number) => {
    const s = Math.min(max, Math.max(min, Math.round((n - min) / step) * step + min));
    if (s === v) return;
    if (value === undefined) setInner(s);
    onValueChange?.(s);
  };
  const fromX = (x: number) => {
    const b = box.current;
    if (!b) return v;
    return min + Math.min(1, Math.max(0, (x - b.left) / b.width)) * (max - min);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !track.current) return;
    // Measure once per drag, never per frame.
    const r = track.current.getBoundingClientRect();
    box.current = { left: r.left + HALF, width: r.width - HALF * 2 };
    e.currentTarget.setPointerCapture(e.pointerId);
    lastX.current = e.clientX;
    setDrag(true);
    set(fromX(e.clientX));
    thumb.current?.focus({ preventScroll: true });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setTilt(Math.max(-14, Math.min(14, -dx * 1.4)));
    clearTimeout(settle.current);
    settle.current = setTimeout(() => setTilt(0), 90);
    set(fromX(e.clientX));
  };
  const up = () => {
    if (!drag) return;
    setDrag(false);
    setTilt(0);
    onValueCommit?.(v);
  };
  const key = (e: KeyboardEvent) => {
    const big = Math.max(step, (max - min) / 10);
    const map: Record<string, number> = { ArrowRight: v + step, ArrowUp: v + step, ArrowLeft: v - step, ArrowDown: v - step, PageUp: v + big, PageDown: v - big, Home: min, End: max };
    if (!(e.key in map)) return;
    e.preventDefault();
    const n = Math.min(max, Math.max(min, map[e.key]));
    set(n);
    onValueCommit?.(n);
  };

  const reachLo = Math.round((v / 1000) * 6.8 * 10) / 10;
  const reachHi = Math.round((v / 1000) * 9.4 * 10) / 10;
  const glide = drag ? "none" : `transform 380ms ${EASE}`;

  return (
    <div
      className={cx(
        "aui061 w-full max-w-[440px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        disabled && "opacity-60",
        className,
      )}
    >
      <style href="asta-aui061" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-start justify-between gap-4" style={rise(0)}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Astabyte Ads</p>
          <p id={`${uid}-l`} className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
            {label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-mute">Est. monthly reach</p>
          <p className="mt-1 inline-flex items-center gap-[2px] text-[15px] font-medium leading-none tracking-[-0.01em] text-ink">
            <span className="sr-only">
              {reachLo}k to {reachHi}k people
            </span>
            <Roll text={reachLo.toFixed(1)} />k – <Roll text={reachHi.toFixed(1)} />k
          </p>
        </div>
      </div>

      <div className="relative mt-14 select-none" style={rise(1)}>
        <div
          ref={track}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className={cx("relative flex h-6 touch-none items-center", disabled ? "pointer-events-none" : "cursor-pointer")}
        >
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
            {/* Fill: a long bar whose right edge rides with the thumb, so only transform moves. */}
            <div className="absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: glide }}>
              <div className="absolute inset-y-0 right-full w-[4000px] bg-brand" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: glide }}>
            <div
              ref={thumb}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-labelledby={`${uid}-l`}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={v}
              aria-valuetext={format(v)}
              aria-disabled={disabled || undefined}
              onKeyDown={key}
              className="group/th pointer-events-auto absolute left-0 top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full outline-none"
            >
              <span
                className="absolute inset-0 rounded-full bg-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_3px_rgb(0_0_0/0.2),0_6px_14px_-4px_rgb(0_0_0/0.25)] transition-transform duration-300 group-focus-visible/th:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_30%,transparent),0_1px_3px_rgb(0_0_0/0.2)]"
                style={{ transform: drag ? "scale(1.12)" : "scale(1)", transitionTimingFunction: SPRING }}
              />
              <span className="absolute inset-[7px] rounded-full bg-brand" />
              {/* The bubble: tilts with drag speed, digits roll. */}
              <span aria-hidden className="absolute bottom-[32px] left-1/2 block origin-bottom transition-transform duration-300" style={{ transform: `translateX(-50%) rotate(${tilt}deg) scale(${drag ? 1.06 : 1})`, transitionTimingFunction: SPRING }}>
                <span className="relative block whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[14px] font-medium tracking-[-0.01em] text-paper shadow-[0_8px_18px_-8px_rgb(0_0_0/0.5)]">
                  <Roll text={format(v)} />
                  <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-ink" />
                </span>
              </span>
            </div>
          </div>
        </div>
        {name && <input type="hidden" name={name} value={v} />}
        <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-mute">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      </div>

      <p className="mt-4 text-[12.5px] text-mute" style={rise(2)}>
        About <span className="font-medium text-ink">{format(Math.round(v / 30))}</span> a day. Pause or change it any time.
      </p>
    </div>
  );
}

export default BubbleSlider;
