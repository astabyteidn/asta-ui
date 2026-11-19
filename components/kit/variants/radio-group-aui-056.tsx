"use client";

import { useId, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui056-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes aui056-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes aui056-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes aui056-pop { 0% { opacity: 0; transform: scale(.2) } 60% { opacity: 1; transform: scale(1.25) } 100% { opacity: 1; transform: scale(1) } }
@media (prefers-reduced-motion: reduce) { .aui056 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui056-rise .6s ${EASE} ${80 + i * 50}ms both` });

export interface SegmentOption {
  value: string;
  label: string;
  /** Headline figure for this range, already formatted (digits roll). */
  figure: string;
  /** Change in percent, signed. */
  change: number;
  /** Chart values, any scale. */
  points: number[];
  /** Start, middle and end labels under the chart. */
  axis?: [string, string, string];
}

const wave = (seed: number, trend: number, n = 28) =>
  Array.from({ length: n }, (_, i) => 50 + trend * i + 6 * Math.sin(i * 0.55 + seed) + 2.2 * Math.sin(i * 1.7 + seed * 2));

const OPTIONS: SegmentOption[] = [
  { value: "1d", label: "1D", figure: "1,284", change: 3.2, points: wave(1, 0.5), axis: ["00:00", "12:00", "Now"] },
  { value: "1w", label: "1W", figure: "9,640", change: 8.1, points: wave(2.4, 0.9), axis: ["Thu", "Mon", "Today"] },
  { value: "1m", label: "1M", figure: "48,210", change: 12.4, points: wave(4, 1.3), axis: ["Oct 19", "Nov 4", "Nov 19"] },
  { value: "3m", label: "3M", figure: "131,900", change: -2.3, points: wave(5.5, -0.35), axis: ["Aug", "Oct", "Nov"] },
  { value: "1y", label: "1Y", figure: "512,400", change: 41, points: wave(7, 2), axis: ["2025", "Jun", "2026"] },
];

const W = 300;
const H = 100;

function paths(points: number[]) {
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const xy = points.map((p, i) => [(i / (points.length - 1)) * W, 8 + (1 - (p - lo) / (hi - lo || 1)) * (H - 16)] as const);
  // Smooth with a simple cardinal curve.
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return { line: d, area: `${d} L${W} ${H} L0 ${H} Z`, end: xy[xy.length - 1] };
}

function Roll({ text }: { text: string }) {
  const chars = text.split("");
  return (
    <span className="inline-flex tabular-nums">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={chars.length - i} className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
              <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700" style={{ transform: `translateY(${-Number(ch) * 10}%)`, transitionTimingFunction: EASE, transitionDelay: `${(chars.length - 1 - i) * 35}ms` }}>
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n} className="block h-[1em] text-center leading-[1em]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          ) : (
            <span key={`c${chars.length - i}`} className="w-[0.28em] leading-[1em]">
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

export interface SegmentRadioProps {
  options?: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  currency?: string;
  name?: string;
  className?: string;
}

/**
 * aui-056 · A dark revenue card whose range is a segmented radio. Signature: the thumb slides between ranges
 * and the chart redraws itself while the figure rolls to the new total.
 */
export function SegmentRadio({ options = OPTIONS, value, defaultValue = "1w", onChange, label = "Net revenue", currency = "$", name, className }: SegmentRadioProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const index = Math.max(0, options.findIndex((o) => o.value === current));
  const opt = options[index];
  const { line, area, end } = paths(opt.points);
  const up = opt.change >= 0;
  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  return (
    <div className={cx("aui056 relative w-full max-w-[420px] overflow-hidden rounded-[14px] bg-ink p-5 text-paper shadow-[0_1px_2px_rgb(0_0_0/0.1),0_24px_48px_-24px_rgb(0_0_0/0.55)] sm:p-6", className)}>
      <style href="asta-aui056" precedence="asta">
        {CSS}
      </style>
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_45%,transparent),transparent)] opacity-60" />

      <div className="relative" style={rise(0)}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/50">Astabyte · {label}</p>
        <div className="mt-2 flex items-end gap-3">
          <p className="flex items-start text-[36px] font-medium leading-none tracking-[-0.045em]">
            <span className="mr-0.5 mt-[4px] text-[15px] tracking-normal text-paper/50">{currency}</span>
            <Roll text={opt.figure} />
          </p>
          <span
            key={opt.value}
            className={cx("mb-1 inline-flex h-6 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium tabular-nums", up ? "bg-[color-mix(in_srgb,var(--color-brand)_30%,transparent)] text-paper" : "bg-paper/10 text-paper/70")}
            style={{ animation: `aui056-fade .4s ${EASE} both` }}
          >
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: up ? "none" : "rotate(180deg)" }}>
              <path d="M6 9.5v-7M2.5 6L6 2.5 9.5 6" />
            </svg>
            {up ? "+" : "−"}
            {Math.abs(opt.change).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative mt-4" style={rise(1)}>
        <svg key={opt.value} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[104px] w-full overflow-visible" role="img" aria-label={`${label} over ${opt.label}: ${currency}${opt.figure}`}>
          <defs>
            <linearGradient id={`${uid}-g`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--color-brand)" stopOpacity="0.45" />
              <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((y) => (
            <line key={y} x1="0" x2={W} y1={H * y} y2={H * y} stroke="currentColor" strokeOpacity="0.07" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${uid}-g)`} style={{ animation: `aui056-fade .8s ${EASE} 200ms both` }} />
          <path
            d={line}
            fill="none"
            stroke="color-mix(in srgb, var(--color-brand) 55%, var(--color-paper))"
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="1"
            style={{ animation: `aui056-draw .9s ${EASE} both` }}
          />
        </svg>
        {/* End point, outside the stretched SVG so it stays round. */}
        <span
          key={`d${opt.value}`}
          aria-hidden
          className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(end[0] / W) * 100}%`, top: `${(end[1] / H) * 104}px` }}
        >
          <span className="block h-full w-full rounded-full bg-paper shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-brand)_60%,transparent)]" style={{ animation: `aui056-pop .5s ${EASE} 750ms both` }} />
        </span>
        <div className="mt-2 flex justify-between font-mono text-[10.5px] tracking-[0.04em] text-paper/40">
          {(opt.axis ?? ["", "", ""]).map((a, i) => (
            <span key={i}>{a}</span>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label="Range" className="relative mt-4 grid rounded-[9px] bg-paper/[0.07] p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-paper)_8%,transparent)]" style={{ ...rise(2), gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.3),0_4px_12px_-4px_rgb(0_0_0/0.5)] transition-transform duration-500"
          style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${index * 100}%)`, transitionTimingFunction: EASE }}
        />
        {options.map((o, i) => {
          const on = i === index;
          const id = `${uid}-${o.value}`;
          return (
            <label key={o.value} htmlFor={id} className="group/seg relative grid h-8 cursor-pointer select-none place-items-center rounded-[7px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[color-mix(in_srgb,var(--color-brand)_70%,var(--color-paper))]">
              <input id={id} type="radio" name={name ?? uid} value={o.value} checked={on} onChange={() => pick(o.value)} className="sr-only" />
              <span className={cx("relative text-[12.5px] font-medium tabular-nums transition-colors duration-300", on ? "text-ink" : "text-paper/55 group-hover/seg:text-paper")}>{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default SegmentRadio;
