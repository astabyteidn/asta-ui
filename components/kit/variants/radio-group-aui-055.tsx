"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const SPRING = "cubic-bezier(.34,1.56,.64,1)";
const CSS = `
@keyframes aui055-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui055-fade { from { opacity: 0 } to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .aui055 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui055-rise .6s ${EASE} ${80 + i * 50}ms both` });

export interface PlanOption {
  value: string;
  name: string;
  description: string;
  /** Price per seat per month. */
  price: number;
  tag?: string;
}

const PLANS: PlanOption[] = [
  { value: "solo", name: "Solo", description: "One person, unlimited docs", price: 0 },
  { value: "team", name: "Team", description: "Shared spaces, guests and history", price: 12, tag: "Popular" },
  { value: "business", name: "Business", description: "SSO, audit log, priority support", price: 28 },
];

function Roll({ value }: { value: number }) {
  const chars = String(value).split("");
  return (
    <span className="inline-flex tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((ch, i) => (
          <span key={chars.length - i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700" style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionTimingFunction: EASE, transitionDelay: `${(chars.length - 1 - i) * 50}ms` }}>
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="block h-[1em] text-center leading-[1em]">
                  {n}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

export interface PlanRadioProps {
  plans?: PlanOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  seats?: number;
  currency?: string;
  title?: string;
  name?: string;
  /** Fires with the chosen plan when the button is pressed. */
  onContinue?: (value: string) => void;
  className?: string;
}

/**
 * aui-055 · Plan rows in a checkout card. Signature: a brand ring glides to the choice and stretches like a drop
 * as it travels, while the total and the plan name in the button roll to match.
 */
export function PlanRadio({ plans = PLANS, value, defaultValue = "team", onChange, seats = 5, currency = "$", title = "Choose a plan", name, onContinue, className }: PlanRadioProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const index = Math.max(0, plans.findIndex((p) => p.value === current));
  const plan = plans[index];
  const rows = useRef<(HTMLLabelElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const drop = useRef<HTMLSpanElement>(null);
  const prevIndex = useRef(index);
  const [ring, setRing] = useState<{ y: number; h: number } | null>(null);

  // Measure on change and on resize only. The move itself is a transform.
  useLayoutEffect(() => {
    const measure = () => {
      const el = rows.current[index];
      if (el) setRing({ y: el.offsetTop, h: el.offsetHeight });
    };
    measure();
    if (prevIndex.current !== index && drop.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drop.current.animate([{ transform: "scale(1, 1)" }, { transform: "scale(.97, 1.14)", offset: 0.35 }, { transform: "scale(1, 1)" }], { duration: 560, easing: EASE });
    }
    prevIndex.current = index;
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, [index]);

  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <div
      className={cx(
        "aui055 w-full max-w-[440px] rounded-[14px] bg-paper p-5 sm:p-6",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_1px_2px_rgb(0_0_0/0.04),0_18px_40px_-20px_rgb(0_0_0/0.25)]",
        className,
      )}
    >
      <style href="asta-aui055" precedence="asta">
        {CSS}
      </style>
      <div className="flex items-end justify-between" style={rise(0)}>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">Astabyte · Billing</p>
          <h3 id={`${uid}-t`} className="mt-1.5 text-[20px] font-medium leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h3>
        </div>
        <p className="pb-0.5 text-[12.5px] text-mute">{seats} seats</p>
      </div>

      <div ref={list} role="radiogroup" aria-labelledby={`${uid}-t`} className="relative mt-4 flex flex-col gap-2">
        {ring && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 transition-transform duration-500" style={{ height: ring.h, transform: `translateY(${ring.y}px)`, transitionTimingFunction: EASE }}>
            <span
              ref={drop}
              style={{ animation: `aui055-fade .5s ${EASE} 420ms both` }}
              className="block h-full w-full rounded-[12px] shadow-[inset_0_0_0_2px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_13%,transparent),0_14px_30px_-18px_var(--color-brand)]"
            />
          </span>
        )}
        {plans.map((p, i) => {
          const on = i === index;
          const id = `${uid}-${p.value}`;
          return (
            <label
              key={p.value}
              ref={(el) => {
                rows.current[i] = el;
              }}
              htmlFor={id}
              style={rise(i + 1)}
              className="group/plan relative flex cursor-pointer select-none items-center gap-3.5 rounded-[12px] bg-paper px-4 py-3.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-transform duration-200 active:scale-[0.99] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-brand"
            >
              <input id={id} type="radio" name={name ?? uid} value={p.value} checked={on} onChange={() => pick(p.value)} className="sr-only" />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] bg-paper-2 opacity-0 transition-opacity duration-300 group-hover/plan:opacity-60" />
              <span aria-hidden className="relative grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_24%,transparent)]">
                <span className="absolute inset-0 rounded-full bg-brand transition-[transform,opacity] duration-300" style={{ opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.5)", transitionTimingFunction: SPRING }} />
                <span className="relative h-1.5 w-1.5 rounded-full bg-white transition-transform duration-300" style={{ transform: on ? "scale(1)" : "scale(0)", transitionTimingFunction: SPRING, transitionDelay: on ? "80ms" : "0ms" }} />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-medium tracking-[-0.01em] text-ink">{p.name}</span>
                  {p.tag && <span className="rounded-[5px] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-[1px] text-[10.5px] font-medium tracking-[0.02em] text-brand">{p.tag}</span>}
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-mute">{p.description}</span>
              </span>
              <span className="relative shrink-0 text-right">
                <span className="text-[22px] font-medium leading-none tracking-[-0.04em] text-ink">
                  <span className="mr-px align-top text-[12px] tracking-normal text-mute">{currency}</span>
                  {p.price}
                </span>
                <span className="mt-1 block text-[11px] text-mute">{p.price ? "per seat" : "free"}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4" style={rise(plans.length + 1)}>
        <div>
          <p className="text-[12px] text-mute">Due today</p>
          <p className="mt-1 flex items-start text-[28px] font-medium leading-none tracking-[-0.04em] text-ink">
            <span className="mr-0.5 mt-[3px] text-[13px] tracking-normal text-mute">{currency}</span>
            <Roll value={plan.price * seats} />
          </p>
        </div>
        <button
          type="button"
          onClick={() => onContinue?.(plan.value)}
          className="group/cta relative inline-flex h-10 items-center gap-1.5 rounded-[8px] bg-brand pl-4 pr-3.5 text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_16px_-8px_var(--color-brand)] outline-none transition-transform duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <span>Continue with</span>
          {/* Plan name rolls with the choice. */}
          <span className="relative block h-5 overflow-hidden" aria-live="polite">
            <span className="invisible block h-5 leading-5">{plans.reduce((a, p) => (p.name.length > a.length ? p.name : a), "")}</span>
            <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-index * 20}px)`, transitionTimingFunction: EASE }}>
              {plans.map((p, i) => (
                <span key={p.value} aria-hidden={i !== index} className="block h-5 text-left leading-5">
                  {p.name}
                </span>
              ))}
            </span>
          </span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8h9.5M8.5 4l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default PlanRadio;
