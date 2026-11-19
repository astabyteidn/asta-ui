"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui062-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui062 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui062-rise .6s ${EASE} ${80 + i * 55}ms both` });

const HALF = 12;

export interface SliderStep {
  label: string;
  /** Monthly price for this step. */
  price: number;
  note?: string;
}

const STEPS: SliderStep[] = [
  { label: "50 GB", price: 4, note: "30 days of version history" },
  { label: "100 GB", price: 6, note: "30 days of version history" },
  { label: "250 GB", price: 10, note: "90 days of version history" },
  { label: "500 GB", price: 16, note: "90 days of version history" },
  { label: "1 TB", price: 24, note: "One year of version history" },
  { label: "2 TB", price: 40, note: "One year of history and legal hold" },
];

function Roll({ value }: { value: number }) {
  const chars = String(value).split("");
  return (
    <span className="inline-flex tabular-nums" aria-hidden>
      {chars.map((ch, i) => (
        <span key={chars.length - i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
          <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionTimingFunction: EASE, transitionDelay: `${(chars.length - 1 - i) * 40}ms` }}>
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block h-[1em] text-center leading-[1em]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export interface StepSliderProps {
  steps?: SliderStep[];
  /** Index of the chosen step. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  label?: string;
  currency?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

/**
 * aui-062 · A stepped storage slider. Signature: the thumb drags freely, then snaps to the nearest step with a
 * small overshoot as the tick label lifts and the size and price roll.
 */
export function StepSlider({ steps = STEPS, value, defaultValue = 3, onValueChange, label = "Storage", currency = "$", disabled, name, className }: StepSliderProps) {
  const uid = useId();
  const last = steps.length - 1;
  const [inner, setInner] = useState(defaultValue);
  const index = Math.min(last, Math.max(0, value ?? inner));
  const [pos, setPos] = useState<number | null>(null); // free position while dragging
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const box = useRef<{ left: number; width: number } | null>(null);
  const p = pos ?? index;
  const near = Math.round(p);
  const k = last ? p / last : 0;
  const step = steps[near];

  const set = (i: number) => {
    const n = Math.min(last, Math.max(0, i));
    if (n === index) return;
    if (value === undefined) setInner(n);
    onValueChange?.(n);
  };
  const fromX = (x: number) => {
    const b = box.current;
    if (!b) return index;
    return Math.min(1, Math.max(0, (x - b.left) / b.width)) * last;
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !track.current) return;
    const r = track.current.getBoundingClientRect();
    box.current = { left: r.left + HALF, width: r.width - HALF * 2 };
    e.currentTarget.setPointerCapture(e.pointerId);
    const f = fromX(e.clientX);
    setPos(f);
    set(Math.round(f));
    thumb.current?.focus({ preventScroll: true });
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pos === null) return;
    const f = fromX(e.clientX);
    setPos(f);
    set(Math.round(f));
  };
  const up = () => {
    if (pos === null) return;
    set(Math.round(pos));
    setPos(null); // snaps with the spring transition
  };
  const key = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowUp: index + 1, ArrowLeft: index - 1, ArrowDown: index - 1, Home: 0, End: last, PageUp: index + 2, PageDown: index - 2 };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(map[e.key]);
  };
  const motion = pos !== null ? "none" : `transform 520ms ${SPRING}`;

  return (
    <div
      className={cx(
        "aui062 w-full max-w-[460px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        disabled && "opacity-60",
        className,
      )}
    >
      <style href="asta-aui062" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-end justify-between gap-4" style={rise(0)}>
        <div className="min-w-0">
          <p id={`${uid}-l`} className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
            Astabyte Drive · {label}
          </p>
          {/* Size rolls between step labels. */}
          <span className="relative mt-2 block h-[40px] overflow-hidden text-[36px] font-medium tracking-[-0.045em] text-ink" aria-live="polite">
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-near * 40}px)`, transitionTimingFunction: EASE }}>
              {steps.map((s, i) => (
                <span key={s.label} aria-hidden={i !== near} className="block h-[40px] whitespace-nowrap leading-[40px]">
                  {s.label}
                </span>
              ))}
            </span>
          </span>
        </div>
        <p className="shrink-0 pb-1 text-right">
          <span className="flex items-start justify-end text-[22px] font-medium leading-none tracking-[-0.03em] text-ink">
            <span className="mr-0.5 mt-[2px] text-[12px] tracking-normal text-mute">{currency}</span>
            <span className="sr-only">{step.price}</span>
            <Roll value={step.price} />
          </span>
          <span className="mt-1 block text-[11.5px] text-mute">per month</span>
        </p>
      </div>
      <p className="mt-1 h-5 text-[13px] text-mute" style={rise(1)}>
        <span key={near} className="block" style={{ animation: `aui062-rise .4s ${EASE} both` }}>
          {step.note}
        </span>
      </p>

      <div className="relative mt-6 select-none" style={rise(2)}>
        <div ref={track} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className={cx("relative flex h-7 touch-none items-center", disabled ? "pointer-events-none" : "cursor-pointer")}>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]">
            <div className="absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: motion }}>
              <div className="absolute inset-y-0 right-full w-[4000px] bg-brand" />
            </div>
          </div>
          {/* Step ticks: white on the fill, grey after it. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: HALF, right: HALF }}>
            {steps.map((s, i) => (
              <span key={s.label} className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${(i / last) * 100}%` }}>
                <span className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_28%,transparent)]" />
                <span className="absolute inset-0 rounded-full bg-white transition-opacity duration-200" style={{ opacity: i <= p ? 0.9 : 0 }} />
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: HALF, right: HALF, transform: `translateX(${k * 100}%)`, transition: motion }}>
            <div
              ref={thumb}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-labelledby={`${uid}-l`}
              aria-valuemin={0}
              aria-valuemax={last}
              aria-valuenow={index}
              aria-valuetext={`${steps[index].label}, ${currency}${steps[index].price} per month`}
              aria-disabled={disabled || undefined}
              onKeyDown={key}
              className="group/th pointer-events-auto absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none"
            >
              <span
                className="absolute inset-0 rounded-[8px] bg-white shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_3px_rgb(0_0_0/0.2),0_6px_14px_-4px_rgb(0_0_0/0.25)] transition-transform duration-300 group-focus-visible/th:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_30%,transparent),0_1px_3px_rgb(0_0_0/0.2)]"
                style={{ transform: pos !== null ? "scale(1.1) rotate(45deg)" : "rotate(45deg)", transitionTimingFunction: SPRING }}
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="flex gap-[3px]">
                  <span className="h-2 w-px bg-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]" />
                  <span className="h-2 w-px bg-[color-mix(in_srgb,var(--color-ink)_35%,transparent)]" />
                </span>
              </span>
            </div>
          </div>
        </div>
        {name && <input type="hidden" name={name} value={steps[index].label} />}
        <div aria-hidden className="relative mt-2 h-4" style={{ marginLeft: HALF, marginRight: HALF }}>
          {steps.map((s, i) => {
            const on = i === near;
            return (
              <button
                key={s.label}
                type="button"
                tabIndex={-1}
                onClick={() => set(i)}
                className={cx("absolute top-0 whitespace-nowrap text-[11px] tabular-nums transition-[transform,opacity,color] duration-300", on ? "font-medium text-ink" : "text-mute hover:text-ink")}
                style={{ left: `${(i / last) * 100}%`, transform: `translateX(-50%) translateY(${on ? -2 : 0}px) scale(${on ? 1.08 : 1})`, transitionTimingFunction: EASE }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StepSlider;
