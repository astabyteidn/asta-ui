"use client";

import type { ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-progress-sweep { from { transform: translateX(-100%) } to { transform: translateX(260%) } }
@keyframes asta-progress-spin { to { transform: rotate(360deg) } }
@keyframes asta-progress-breathe { 50% { opacity: .45 } }`;

const EASE = "cubic-bezier(.16,1,.3,1)";

function clamp(value: number | undefined, max: number) {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return Math.max(0, Math.min(max, value));
}

interface Shared {
  /** Current amount. Leave it out for an indeterminate state. */
  value?: number;
  max?: number;
  /** Accessible name, also shown above the bar. */
  label?: string;
  /** Show the percentage. */
  showValue?: boolean;
  /** Custom text for the value, e.g. "3 of 8 files". */
  valueText?: string;
  className?: string;
}

export interface ProgressBarProps extends Shared {
  size?: "sm" | "md";
  /** Keep the label visually hidden (it stays for screen readers). */
  hideLabel?: boolean;
}

/**
 * A linear progress bar. The fill eases to each new value. Without `value` a short segment sweeps
 * across the track, and with reduced motion it breathes in place instead.
 */
export function ProgressBar({ value, max = 100, label = "Progress", showValue, valueText, size = "md", hideLabel, className }: ProgressBarProps) {
  const v = clamp(value, max);
  const pct = v === undefined ? undefined : (v / max) * 100;
  const text = valueText ?? (pct === undefined ? undefined : `${Math.round(pct)}%`);

  return (
    <div className={cx("w-full", className)}>
      <style href="asta-progress" precedence="asta">{KEYFRAMES}</style>
      {(!hideLabel || showValue) && (
        <div className="mb-2 flex items-baseline justify-between gap-4 text-[13px]">
          <span className={cx("text-ink-2", hideLabel && "sr-only")}>{label}</span>
          {showValue && text && <span className="tabular-nums text-mute">{text}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={v === undefined ? "Loading" : text}
        aria-busy={v === undefined || undefined}
        className={cx("relative w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]", size === "md" ? "h-1.5" : "h-1")}
      >
        {pct === undefined ? (
          <span
            className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-brand motion-reduce:!w-full motion-reduce:![animation:asta-progress-breathe_1.8s_ease-in-out_infinite]"
            style={{ animation: `asta-progress-sweep 1.5s ${EASE} infinite` }}
          />
        ) : (
          <span
            className="absolute inset-0 rounded-full bg-brand transition-transform duration-700 motion-reduce:transition-none"
            style={{ transform: `translateX(${pct - 100}%)`, transitionTimingFunction: EASE }}
          />
        )}
      </div>
    </div>
  );
}

export interface ProgressRingProps extends Shared {
  /** Diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Shown in the middle. Defaults to the percentage when `showValue` is on. */
  children?: ReactNode;
}

/**
 * A circular progress ring. The arc eases to each new value. Without `value` a quarter arc spins,
 * and with reduced motion it breathes in place instead.
 */
export function ProgressRing({ value, max = 100, label = "Progress", showValue, valueText, size = 44, thickness = 3.5, children, className }: ProgressRingProps) {
  const v = clamp(value, max);
  const pct = v === undefined ? undefined : (v / max) * 100;
  const text = valueText ?? (pct === undefined ? undefined : `${Math.round(pct)}%`);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const inner = children ?? (showValue && text ? <span className="tabular-nums">{text}</span> : null);

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={v}
      aria-valuetext={v === undefined ? "Loading" : text}
      aria-busy={v === undefined || undefined}
      className={cx("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <style href="asta-progress" precedence="asta">{KEYFRAMES}</style>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-hidden
        className={cx("absolute inset-0", pct === undefined && "motion-reduce:![animation:asta-progress-breathe_1.8s_ease-in-out_infinite]")}
        style={pct === undefined ? { animation: "asta-progress-spin 1s linear infinite" } : { transform: "rotate(-90deg)" }}
      >
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={thickness} style={{ stroke: "color-mix(in srgb, var(--color-ink) 9%, transparent)" }} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={pct === undefined ? 75 : 100 - pct}
          className="stroke-brand transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
          style={{ transitionTimingFunction: EASE, opacity: pct === 0 ? 0 : 1 }}
        />
      </svg>
      {inner && <span className="relative text-[11px] font-medium text-ink">{inner}</span>}
    </span>
  );
}

export default ProgressBar;
