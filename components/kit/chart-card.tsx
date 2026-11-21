"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-chart-reveal { from { transform: scaleX(0) } }
@keyframes asta-chart-bar { from { transform: translateY(100%) } }
@keyframes asta-chart-fade { from { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .asta-chart-a { animation: none !important; transition: none !important } }`;

export type ChartType = "area" | "line" | "bar";

export interface ChartSeries {
  label: string;
  data: number[];
}

export interface ChartProps {
  type?: ChartType;
  /** One label per point, e.g. days or months. */
  labels: string[];
  /** The first series is drawn in brand blue. A second one is drawn muted (dashed for lines), e.g. last period. */
  series: ChartSeries[];
  /** Formats values on the axis and in the tooltip. */
  format?: (n: number) => string;
  /** Plot height in px. */
  height?: number;
  /** Accessible name, e.g. "Revenue, last 30 days". */
  label: string;
  /** Show every nth x label. Defaults to fitting about seven. */
  labelEvery?: number;
  /** Start the y axis at zero. Default true for area and bar, false for line. */
  zero?: boolean;
  className?: string;
}

const W = 600;

/** A round step (1, 2 or 5 × 10ⁿ) at or above n. */
function niceStep(n: number) {
  if (n <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** Axis bounds and ticks on round numbers, about four steps. */
function niceRange(lo: number, hi: number) {
  if (hi <= lo) hi = lo + 1;
  const step = niceStep((hi - lo) / 4);
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + step / 2; t += step) ticks.push(t);
  return { min, max, ticks };
}

/** A smooth curve that passes through every point and never overshoots it (monotone cubic). */
function smooth(pts: [number, number][]) {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]} ${pts[0][1]}` : "";
  const dx = pts.slice(1).map((p, i) => p[0] - pts[i][0]);
  const sl = pts.slice(1).map((p, i) => (p[1] - pts[i][1]) / (dx[i] || 1));
  const t = pts.map((_, i) => {
    if (i === 0) return sl[0];
    if (i === n - 1) return sl[n - 2];
    if (sl[i - 1] * sl[i] <= 0) return 0;
    return (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / sl[i - 1] + (dx[i] + 2 * dx[i - 1]) / sl[i]);
  });
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(pts[i][0] + h)} ${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)} ${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])} ${f(pts[i + 1][1])}`;
  }
  return d;
}

/**
 * A chart drawn from data with plain SVG and CSS: area, line or bars. Lines sweep in from the left, bars rise and
 * glide to new values. Point at it, drag a finger across it, or focus it and use ← → for a crosshair and a
 * tooltip. A hidden table carries the numbers for screen readers.
 */
export function Chart({ type = "area", labels, series, format = (n) => n.toLocaleString("en-US"), height = 200, label, labelEvery, zero, className }: ChartProps) {
  const id = useId().replace(/:/g, "");
  const [active, setActive] = useState<number | null>(null);
  const n = labels.length;
  const values = series.flatMap((s) => s.data);
  const fromZero = zero ?? type !== "line";
  const { min, max, ticks } = niceRange(fromZero ? 0 : Math.min(...values) - (Math.max(...values) - Math.min(...values)) * 0.15, Math.max(0, ...values));
  /** Share of the plot height for a value, 0 at the bottom. */
  const at = (v: number) => (v - min) / (max - min);
  const every = labelEvery ?? Math.max(1, Math.ceil(n / 7));
  const key = series.map((s) => s.data.join(",")).join("|");
  const bars = type === "bar";
  // x position (0–1) of point i: points sit on the edges for lines, in the middle of each slot for bars.
  const xAt = (i: number) => (bars ? (i + 0.5) / n : n > 1 ? i / (n - 1) : 0.5);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setActive(bars ? Math.min(n - 1, Math.floor(t * n)) : Math.round(t * (n - 1)));
  };
  const onKey = (e: KeyboardEvent) => {
    const go = (i: number) => {
      e.preventDefault();
      setActive(Math.max(0, Math.min(n - 1, i)));
    };
    if (e.key === "ArrowRight") go(active === null ? 0 : active + 1);
    else if (e.key === "ArrowLeft") go(active === null ? n - 1 : active - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(n - 1);
    else if (e.key === "Escape") setActive(null);
  };

  const tipLeft = active === null ? 0 : xAt(active);

  return (
    <div className={cx("flex w-full flex-col", className)}>
      <style href="asta-chart" precedence="asta">{KEYFRAMES}</style>
      <div className="flex">
        {/* y axis */}
        <div aria-hidden className="relative mr-2 w-10 shrink-0" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 text-[10.5px] tabular-nums text-mute" style={{ top: `${(1 - at(t)) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div
          role="group"
          aria-label={`${label}. Use the left and right arrows to read each point.`}
          tabIndex={0}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          className="relative min-w-0 flex-1 touch-pan-y rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
          style={{ height }}
        >
          {ticks.map((t) => (
            <span key={t} aria-hidden className={cx("absolute inset-x-0 h-px", t === min ? "bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]" : "bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]")} style={{ top: `${(1 - at(t)) * 100}%` }} />
          ))}

          {bars ? (
            <div aria-hidden className="absolute inset-0 flex">
              {labels.map((l, i) => (
                <div key={l + i} className="flex h-full flex-1 justify-center">
                  <div className="flex h-full w-[62%] items-end justify-center gap-[3px]">
                  {series.map((s, si) => (
                    <div key={s.label} className="relative h-full max-w-[28px] flex-1 overflow-hidden rounded-t-[5px]">
                      <div
                        className={cx(
                          "asta-chart-a absolute inset-0 rounded-t-[5px] transition-[transform,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] animate-[asta-chart-bar_.9s_cubic-bezier(.16,1,.3,1)_backwards]",
                          si === 0 ? "bg-brand" : "bg-[color-mix(in_srgb,var(--color-ink)_16%,var(--color-paper))]",
                          active !== null && active !== i && "opacity-45",
                        )}
                        style={{ transform: `translateY(${(1 - at(s.data[i] ?? 0)) * 100}%)`, transitionDelay: `${i * 18}ms, 0ms`, animationDelay: `${i * 30}ms` }}
                      />
                    </div>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <svg aria-hidden viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--color-brand)" stopOpacity="0.2" />
                  <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
                </linearGradient>
                <clipPath id={`${id}-clip`}>
                  <rect key={key} x="0" y="-10" width={W} height={height + 20} className="asta-chart-a origin-left animate-[asta-chart-reveal_1.1s_cubic-bezier(.16,1,.3,1)_both] [transform-box:fill-box]" />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-clip)`}>
                {[...series].reverse().map((s, ri) => {
                  const si = series.length - 1 - ri;
                  const pts = s.data.map((v, i) => [xAt(i) * W, height - at(v) * height] as [number, number]);
                  const line = smooth(pts);
                  return (
                    <g key={s.label}>
                      {type === "area" && si === 0 && <path d={`${line} L${W} ${height} L0 ${height} Z`} fill={`url(#${id}-fill)`} />}
                      <path
                        d={line}
                        fill="none"
                        stroke={si === 0 ? "var(--color-brand)" : "color-mix(in srgb, var(--color-ink) 32%, transparent)"}
                        strokeWidth={si === 0 ? 2 : 1.5}
                        strokeDasharray={si === 0 ? undefined : "4 4"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Crosshair, dots and tooltip */}
          {active !== null && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {!bars && <span className="absolute inset-y-0 w-px bg-[color-mix(in_srgb,var(--color-ink)_22%,transparent)]" style={{ left: `${tipLeft * 100}%` }} />}
              {!bars &&
                series.map((s, si) => (
                  <span
                    key={s.label}
                    className={cx("absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper", si === 0 ? "bg-brand" : "bg-mute")}
                    style={{ left: `${tipLeft * 100}%`, top: `${(1 - at(s.data[active] ?? 0)) * 100}%` }}
                  />
                ))}
              <div
                className={cx(
                  "asta-chart-a absolute top-0 z-10 min-w-[128px] animate-[asta-chart-fade_.15s_ease-out] rounded-[9px] bg-ink px-3 py-2 text-paper shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)]",
                  tipLeft > 0.6 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]",
                )}
                style={{ left: `${tipLeft * 100}%` }}
              >
                <p className="text-[11px] text-paper/60">{labels[active]}</p>
                {series.map((s, si) => (
                  <p key={s.label} className="mt-0.5 flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-paper/75">
                      <span className={cx("h-1.5 w-1.5 rounded-full", si === 0 ? "bg-brand" : "bg-paper/45")} />
                      {s.label}
                    </span>
                    <span className="font-medium tabular-nums">{format(s.data[active] ?? 0)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* x axis */}
      <div aria-hidden className="relative ml-12 mt-2 h-4">
        {labels.map((l, i) =>
          i % every === 0 ? (
            <span key={l + i} className={cx("absolute top-0 whitespace-nowrap text-[10.5px] text-mute", i === 0 && !bars ? "" : i === n - 1 && !bars ? "-translate-x-full" : "-translate-x-1/2")} style={{ left: `${xAt(i) * 100}%` }}>
              {l}
            </span>
          ) : null,
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {active !== null ? `${labels[active]}: ${series.map((s) => `${s.label} ${format(s.data[active] ?? 0)}`).join(", ")}` : ""}
      </p>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            {series.map((s) => (
              <th key={s.label} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l + i}>
              <th scope="row">{l}</th>
              {series.map((s) => (
                <td key={s.label}>{format(s.data[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface ChartCardProps extends ChartProps {
  title: string;
  /** The headline number, already formatted. */
  value?: string;
  /** Change in percent. Up reads blue, down stays neutral. */
  delta?: number;
  deltaLabel?: string;
  /** Controls on the right of the header, e.g. a range switch. */
  actions?: ReactNode;
}

/** A dashboard card: a title, a headline number with its change, controls, a legend and a chart. */
export function ChartCard({ title, value, delta, deltaLabel, actions, className, ...chart }: ChartCardProps) {
  const up = (delta ?? 0) > 0;
  return (
    <div className={cx("flex min-w-0 flex-col gap-4 rounded-xl bg-paper p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent)] sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-mute">{title}</p>
          {value && (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[26px] font-medium leading-none tracking-[-0.04em] tabular-nums text-ink">{value}</span>
              {delta !== undefined && (
                <span className={cx("text-[12.5px] font-medium tabular-nums", up ? "text-brand" : "text-mute")}>
                  {delta > 0 ? "▲" : delta < 0 ? "▼" : ""} {Math.abs(delta).toFixed(1)}%{deltaLabel && <span className="ml-1 font-normal text-mute">{deltaLabel}</span>}
                </span>
              )}
            </p>
          )}
        </div>
        {actions}
      </div>
      {chart.series.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mute">
          {chart.series.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span aria-hidden className={cx("h-[3px] w-3.5 rounded-full", i === 0 ? "bg-brand" : "bg-[color-mix(in_srgb,var(--color-ink)_30%,transparent)]")} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <Chart {...chart} />
    </div>
  );
}

export default ChartCard;
