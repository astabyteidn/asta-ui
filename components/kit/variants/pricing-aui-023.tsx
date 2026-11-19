"use client";

import { useEffect, useId, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface UsagePricingProps {
  /** Volume tiers, in order. A tier applies while the amount is at or below `upTo`; its unit price covers every unit. */
  tiers?: { label: string; upTo: number; unitPrice: number }[];
  /** What the slider counts, singular, e.g. "seat" or "1k requests". */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  currency?: string;
  onChange?: (value: number, total: number) => void;
  cta?: { label: string; href: string };
  /** Sweep the slider from `min` up to `defaultValue` once after mount. */
  intro?: boolean;
  className?: string;
}

const TIERS: NonNullable<UsagePricingProps["tiers"]> = [
  { label: "Starter", upTo: 10, unitPrice: 12 },
  { label: "Team", upTo: 50, unitPrice: 10 },
  { label: "Scale", upTo: 150, unitPrice: 8 },
  { label: "Volume", upTo: Infinity, unitPrice: 6 },
];

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";
const THUMB = 20;
const BARS = 44;

const CSS = `
@keyframes aui-usage-rise { from { opacity: 0; transform: translateY(10px) } }
@keyframes aui-usage-bar { from { transform: scaleY(0) } }
.aui-usage-rise { animation: aui-usage-rise .65s cubic-bezier(.16,1,.3,1) both }
.aui-usage-bar { animation: aui-usage-bar .8s cubic-bezier(.16,1,.3,1) both; transform-origin: bottom }
.aui-usage-range { -webkit-appearance: none; appearance: none; background: transparent }
.aui-usage-range::-webkit-slider-runnable-track { height: ${THUMB}px; background: transparent }
.aui-usage-range::-moz-range-track { height: ${THUMB}px; background: transparent }
.aui-usage-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: ${THUMB}px; height: ${THUMB}px; border-radius: 999px; cursor: grab;
  background: var(--color-paper); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-brand) 35%, transparent), 0 4px 12px rgb(0 0 0 / .4);
  transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s cubic-bezier(.16,1,.3,1);
}
.aui-usage-range::-moz-range-thumb {
  width: ${THUMB}px; height: ${THUMB}px; border: 0; border-radius: 999px; cursor: grab;
  background: var(--color-paper); box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-brand) 35%, transparent), 0 4px 12px rgb(0 0 0 / .4);
  transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s cubic-bezier(.16,1,.3,1);
}
.aui-usage-range:hover::-webkit-slider-thumb { transform: scale(1.08) }
.aui-usage-range:hover::-moz-range-thumb { transform: scale(1.08) }
.aui-usage-range:active::-webkit-slider-thumb { transform: scale(1.15); cursor: grabbing }
.aui-usage-range:active::-moz-range-thumb { transform: scale(1.15); cursor: grabbing }
.aui-usage-range:focus-visible { outline: none }
.aui-usage-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px var(--color-brand), 0 0 0 9px color-mix(in srgb, var(--color-brand) 25%, transparent) }
.aui-usage-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px var(--color-brand), 0 0 0 9px color-mix(in srgb, var(--color-brand) 25%, transparent) }
@media (prefers-reduced-motion: reduce) {
  .aui-usage-rise, .aui-usage-bar { animation: none }
  .aui-usage-range::-webkit-slider-thumb { transition: none }
  .aui-usage-range::-moz-range-thumb { transition: none }
  .aui-usage-move { transition: none !important }
}
`;

function RollChar({ c, delay }: { c: string; delay: number }) {
  if (!/\d/.test(c)) return <span className="inline-block">{c}</span>;
  const d = Number(c);
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <span
        className={cx("aui-usage-move absolute inset-x-0 top-0 flex flex-col transition-transform duration-500", EASE)}
        style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: `${delay}ms` }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] text-center leading-[1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Formatted text whose digits roll; keyed from the right so new leading digits slide in without reshuffling. */
function Roll({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span aria-hidden className="inline-flex tabular-nums">
      {chars.map((c, i) => (
        <RollChar key={chars.length - i} c={c} delay={(chars.length - 1 - i) * 30} />
      ))}
    </span>
  );
}

/** aui-023 · A dark usage calculator: a cost histogram lights up to the thumb, a bubble rides it, the price rolls and the tier marker glides. */
export function UsagePricing({
  tiers = TIERS,
  unit = "seat",
  min = 1,
  max = 200,
  step = 1,
  defaultValue = 36,
  currency = "$",
  onChange,
  cta,
  intro = false,
  className,
}: UsagePricingProps) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const target = clamp(defaultValue);
  const [value, setValue] = useState(intro ? min : target);
  const touched = useRef(false);

  const tierFor = (n: number) => Math.max(0, tiers.findIndex((t) => n <= t.upTo));
  const totalFor = (n: number) => Math.round(n * (tiers[tierFor(n)]?.unitPrice ?? 0));
  const tierIndex = tierFor(value);
  const tier = tiers[tierIndex];
  const total = totalFor(value);
  const fmt = (n: number) => n.toLocaleString("en-US");
  const pct = (n: number) => (n - min) / (max - min || 1);
  const plural = (n: number) => (n === 1 ? unit : `${unit}s`);

  useEffect(() => {
    if (!intro) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (touched.current) return;
      if (!start) start = t + 500;
      const k = reduce ? 1 : Math.min(1, Math.max(0, (t - start) / 1400));
      const e = 1 - Math.pow(1 - k, 4);
      setValue(Math.round(min + (target - min) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [intro, min, target]);

  function set(n: number) {
    touched.current = true;
    const next = clamp(n);
    setValue(next);
    onChange?.(next, totalFor(next));
  }

  const breaks = tiers.filter((t) => Number.isFinite(t.upTo) && t.upTo > min && t.upTo < max);
  const bars = Array.from({ length: BARS }, (_, i) => {
    const v = min + ((i + 0.5) / BARS) * (max - min);
    return { v, h: totalFor(v) };
  });
  const peak = Math.max(1, ...bars.map((b) => b.h));
  const rise = (n: number) => ({ animationDelay: `${80 + n * 55}ms` });
  const action = cta ?? { label: `Start with ${tier?.label ?? "this plan"}`, href: "#" };

  return (
    <div
      className={cx(
        "relative w-full max-w-[460px] overflow-hidden rounded-[14px] bg-ink p-6 text-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_30px_60px_-28px_rgb(0_0_0/0.6)] sm:p-7",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand) 32%, transparent), transparent)" }}
      />

      <div className="aui-usage-rise relative flex items-center justify-between gap-3" style={rise(0)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/50">Estimate · monthly</p>
        <span className="flex h-6 items-center gap-1.5 rounded-[6px] bg-paper/[0.08] px-2 text-[12px] text-paper/80">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          <span key={tier?.label} className="aui-usage-rise inline-block">
            {tier?.label}
          </span>
        </span>
      </div>

      <div className="aui-usage-rise relative mt-4" style={rise(1)}>
        <p className="flex items-start font-medium leading-none tracking-[-0.045em]">
          <span className="mr-1 mt-1.5 text-[20px] text-paper/70">{currency}</span>
          <span className="text-[56px]">
            <Roll text={fmt(total)} />
          </span>
          <span className="ml-2 self-end pb-2 text-[13px] font-normal tracking-normal text-paper/50">/ month</span>
        </p>
        <p className="mt-2 text-[13px] text-paper/55">
          {fmt(value)} {plural(value)} × {currency}
          {tier?.unitPrice} per {unit}
        </p>
      </div>

      <div className="aui-usage-rise relative mt-8" style={rise(2)}>
        <div className="relative h-[92px]" style={{ marginLeft: THUMB / 2, marginRight: THUMB / 2 }}>
          <div aria-hidden className="absolute inset-x-0 top-0 h-0">
            <div className={cx("aui-usage-move w-full transition-transform duration-150", EASE)} style={{ transform: `translateX(${pct(value) * 100}%)` }}>
              <span className="absolute left-0 top-0 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-paper px-2 py-1 text-[12px] font-medium text-ink shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]">
                {fmt(value)} {plural(value)}
                <span className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-1 rotate-45 bg-paper" />
              </span>
            </div>
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-[56px] items-end gap-[3px]">
            {bars.map((b, i) => (
              <span key={i} className="flex h-full flex-1 items-end">
                <span
                  className={cx("aui-usage-bar block w-full rounded-t-[2px] transition-colors duration-200", b.v <= value ? "bg-brand" : "bg-paper/[0.12]")}
                  style={{ height: `${Math.max(8, (b.h / peak) * 100)}%`, animationDelay: `${240 + i * 14}ms` }}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-2" style={{ height: THUMB }}>
          <div className="absolute inset-y-0" style={{ left: THUMB / 2, right: THUMB / 2 }}>
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-paper/[0.12]">
              <div className={cx("aui-usage-move h-full w-full origin-left bg-brand transition-transform duration-150", EASE)} style={{ transform: `scaleX(${pct(value)})` }} />
            </div>
            {breaks.map((t) => (
              <span key={t.upTo} aria-hidden className={cx("absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full", value > t.upTo ? "bg-paper/80" : "bg-paper/25")} style={{ left: `${pct(t.upTo) * 100}%` }} />
            ))}
          </div>
          <label htmlFor={id} className="sr-only">
            Number of {unit}s
          </label>
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onPointerDown={() => (touched.current = true)}
            onKeyDown={() => (touched.current = true)}
            onChange={(e) => set(Number(e.target.value))}
            aria-valuetext={`${fmt(value)} ${plural(value)}, ${currency}${fmt(total)} per month, ${tier?.label} tier`}
            className="aui-usage-range absolute inset-0 m-0 h-full w-full cursor-pointer"
          />
        </div>
        <div aria-hidden className="relative mt-2 h-4 font-mono text-[11px] tabular-nums text-paper/40" style={{ marginLeft: THUMB / 2, marginRight: THUMB / 2 }}>
          {!breaks.some((t) => pct(t.upTo) < 0.08) && <span className="absolute left-0 -translate-x-1/2">{min}</span>}
          {breaks.map((t) => (
            <span key={t.upTo} className="absolute -translate-x-1/2" style={{ left: `${pct(t.upTo) * 100}%` }}>
              {t.upTo}
            </span>
          ))}
          {!breaks.some((t) => pct(t.upTo) > 0.92) && <span className="absolute right-0 translate-x-1/2">{max}</span>}
        </div>
      </div>

      <div className="aui-usage-rise relative mt-6 grid rounded-[10px] bg-paper/[0.05] p-1" style={{ ...rise(3), gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }} role="group" aria-label="Tiers">
        <span
          aria-hidden
          className={cx("aui-usage-move absolute bottom-1 left-1 top-1 rounded-[7px] bg-paper/[0.1] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand)_70%,transparent)] transition-transform duration-500", EASE)}
          style={{ width: `calc((100% - 8px) / ${tiers.length})`, transform: `translateX(${tierIndex * 100}%)` }}
        />
        {tiers.map((t, i) => {
          const on = i === tierIndex;
          const from = i === 0 ? min : Math.min(max, (tiers[i - 1]?.upTo ?? min) + 1);
          return (
            <button
              key={t.label}
              type="button"
              aria-current={on ? "true" : undefined}
              aria-label={`${t.label}: ${currency}${t.unitPrice} per ${unit}, from ${from}`}
              onClick={() => set(from)}
              className={cx(
                "relative z-10 flex flex-col items-start rounded-[7px] px-2.5 py-2 text-left outline-none transition-[color,transform] duration-300 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/60",
                EASE,
                on ? "text-paper" : "text-paper/50 hover:text-paper/80",
              )}
            >
              <span className="text-[13px] font-medium">{t.label}</span>
              <span className="text-[11.5px] tabular-nums opacity-70">
                {currency}
                {t.unitPrice}/{unit}
              </span>
            </button>
          );
        })}
      </div>

      <div className="aui-usage-rise relative mt-6 flex items-center justify-between gap-3" style={rise(4)}>
        <p className="text-[12.5px] leading-snug text-paper/50">Prorated daily. Change {unit}s any time.</p>
        <a
          href={action.href}
          className={cx(
            "group inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[8px] bg-brand px-4 text-[13.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--color-brand)] outline-none transition-transform duration-300 hover:-translate-y-px active:translate-y-0 active:scale-[.97] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
            EASE,
          )}
        >
          {action.label}
          <svg viewBox="0 0 16 16" className={cx("h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5", EASE)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>
      </div>
      <style href="asta-pricing-aui-023" precedence="asta">{CSS}</style>
    </div>
  );
}

export default UsagePricing;
