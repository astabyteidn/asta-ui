"use client";

import { useLayoutEffect, useRef } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-stat-draw { from { stroke-dashoffset: 1 } }
@keyframes asta-stat-fade { from { opacity: 0 } }
@keyframes asta-stat-dot { from { opacity: 0; transform: scale(0) } } /* perf-ok: 4px end-of-line dot, not a surface */
.asta-stat[data-inview="false"] .asta-stat-a { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) { .asta-stat .asta-stat-a { animation: none !important } }`;

const W = 96;
const H = 32;

export interface StatCardProps {
  label: string;
  value: number;
  /** Number format, e.g. `{ style: "currency", currency: "USD", maximumFractionDigits: 0 }`. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Change in percent. Up is blue, down stays neutral. */
  delta?: number;
  /** What the delta compares against, e.g. "vs last week". */
  deltaLabel?: string;
  /** Points for the sparkline, oldest first. */
  data?: number[];
  /** Count-up length in ms. */
  duration?: number;
  className?: string;
}

/** A smooth path through the points (quadratic curves through the midpoints). */
function spark(data: number[]) {
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * (W - 4) + 2, H - 3 - ((v - min) / span) * (H - 6)] as const);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const end = pts[pts.length - 1];
  d += ` L${end[0].toFixed(1)} ${end[1].toFixed(1)}`;
  return { line: d, area: `${d} L${end[0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`, end };
}

/**
 * A KPI tile: a label, a value that counts up when the card scrolls into view (and from the old value to the
 * new one when it changes), a delta and a tiny sparkline that draws itself in. Up reads blue, down stays neutral.
 */
export function StatCard({ label, value, format, locale = "en-US", prefix = "", suffix = "", delta, deltaLabel, data, duration = 1100, className }: StatCardProps) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const started = useRef(false);
  const fmtKey = JSON.stringify(format ?? {});
  const fmt = new Intl.NumberFormat(locale, format);
  const text = `${prefix}${fmt.format(value)}${suffix}`;

  // Count up. Writes straight to the text node, so a frame never re-renders React.
  useLayoutEffect(() => {
    const node = num.current?.firstChild;
    const el = root.current;
    if (!node || !el) return;
    const f = new Intl.NumberFormat(locale, JSON.parse(fmtKey) as Intl.NumberFormatOptions);
    const write = (v: number) => {
      shown.current = v;
      node.nodeValue = `${prefix}${f.format(v)}${suffix}`;
    };
    let raf = 0;
    const run = (from: number) => {
      if (from === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return write(value);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        write(t < 1 ? from + (value - from) * (1 - Math.pow(1 - t, 4)) : value);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      write(from);
      raf = requestAnimationFrame(tick);
    };

    if (started.current || typeof IntersectionObserver === "undefined") {
      started.current = true;
      el.dataset.inview = "true";
      run(shown.current);
      return () => cancelAnimationFrame(raf);
    }
    // First time: wait until the card is on screen, and start the sparkline with it.
    write(0);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        started.current = true;
        el.dataset.inview = "true";
        run(0);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, locale, fmtKey, prefix, suffix, duration]);

  const trend = delta ?? (data && data.length > 1 ? data[data.length - 1] - data[0] : 0);
  const up = trend > 0;
  const path = data && data.length > 1 ? spark(data) : null;

  return (
    <div ref={root} data-inview="false" className={cx("asta-stat flex flex-col gap-3 rounded-xl bg-paper-2 p-5", className)}>
      <style href="asta-stat-card" precedence="asta">{KEYFRAMES}</style>
      <p className="text-[13px] text-mute">{label}</p>
      <div className="flex items-end justify-between gap-4">
        <p className="text-[28px] font-medium leading-none tracking-[-0.04em] text-ink tabular-nums">
          <span ref={num} aria-hidden>
            {text}
          </span>
          <span className="sr-only">{text}</span>
        </p>
        {path && (
          <svg key={data!.join(",")} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={cx("shrink-0 overflow-visible", up ? "text-brand" : "text-mute")} aria-hidden>
            <path d={path.area} fill="currentColor" className="asta-stat-a animate-[asta-stat-fade_.9s_cubic-bezier(.16,1,.3,1)_.5s_both]" opacity={0.1} />
            <path
              d={path.line}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              className="asta-stat-a animate-[asta-stat-draw_1.2s_cubic-bezier(.16,1,.3,1)_both]"
            />
            <circle
              cx={path.end[0]}
              cy={path.end[1]}
              r="2.25"
              fill="currentColor"
              className="asta-stat-a origin-center animate-[asta-stat-dot_.5s_cubic-bezier(.16,1,.3,1)_.9s_both] [transform-box:fill-box]"
            />
          </svg>
        )}
      </div>
      {delta !== undefined && (
        <p className="flex items-center gap-1.5 text-[12.5px]">
          <span className={cx("inline-flex items-center gap-0.5 font-medium tabular-nums", up ? "text-brand" : "text-mute")}>
            <svg viewBox="0 0 12 12" className={cx("h-3 w-3", !up && delta !== 0 && "rotate-180", delta === 0 && "hidden")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9.5v-7M2.75 5.5 6 2.25 9.25 5.5" />
            </svg>
            <span className="sr-only">{up ? "Up" : delta < 0 ? "Down" : "No change"}</span>
            {`${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toFixed(1)}%`}
          </span>
          {deltaLabel && <span className="text-mute">{deltaLabel}</span>}
        </p>
      )}
    </div>
  );
}

export default StatCard;
