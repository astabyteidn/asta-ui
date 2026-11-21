"use client";

import type { ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-meter-in { from { transform: scaleX(0) } }
@keyframes asta-meter-fade { from { opacity: 0; transform: translateY(2px) } }
@media (prefers-reduced-motion: reduce) { .asta-meter-a { animation: none !important; transition: none !important } }`;

// Segment fills, strongest first: brand, then softer brand, then greys. Tokens only.
const FILLS = [
  "var(--color-brand)",
  "color-mix(in srgb, var(--color-brand) 55%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 62%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 28%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 14%, var(--color-paper))",
];

export interface MeterSegment {
  label: string;
  value: number;
}

export interface MeterProps {
  label: string;
  /** Total used. Ignored when `segments` is given (their sum is used). */
  value?: number;
  max: number;
  /** Split the bar into parts, e.g. photos, video and documents. */
  segments?: MeterSegment[];
  /** Formats every number shown. Defaults to plain grouping. */
  format?: (n: number) => string;
  /** From this share of max (0–1) the bar turns ink and a note shows. Default 0.9. */
  warnAt?: number;
  /** Note shown past `warnAt`. */
  warning?: ReactNode;
  /** Something on the right of the label row, e.g. an Upgrade link. */
  action?: ReactNode;
  size?: "sm" | "md";
  /** Show the legend under the bar (segments only). Default true. */
  legend?: boolean;
  className?: string;
}

/**
 * How much of a limit is used: storage, seats, API calls. One bar, optionally split into parts with a legend.
 * The bar sweeps in from the left on first paint and its parts glide when the values change. Past the warning
 * level it turns ink and says so, in words rather than red.
 */
export function Meter({ label, value = 0, max, segments, format = (n) => n.toLocaleString("en-US"), warnAt = 0.9, warning = "Almost at your limit", action, size = "md", legend = true, className }: MeterProps) {
  const parts = segments?.length ? segments : [{ label, value }];
  const used = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  const share = max > 0 ? Math.min(1, used / max) : 0;
  const warn = share >= warnAt;
  // Where each part starts, as a share of max.
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((a, p) => a + Math.max(0, p.value), 0) / (max || 1));

  return (
    <div className={cx("flex w-full flex-col", size === "sm" ? "gap-2" : "gap-2.5", className)}>
      <style href="asta-meter" precedence="asta">{KEYFRAMES}</style>
      <div className="flex items-baseline justify-between gap-3">
        <p className={cx("font-medium text-ink", size === "sm" ? "text-[13px]" : "text-[14px]")}>{label}</p>
        {action}
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        aria-valuetext={`${format(used)} of ${format(max)}${warn ? `. ${typeof warning === "string" ? warning : ""}` : ""}`}
        className={cx("relative w-full overflow-hidden rounded-full bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <div className="asta-meter-a absolute inset-0 origin-left animate-[asta-meter-in_1s_cubic-bezier(.16,1,.3,1)_both]">
          {parts.map((p, i) => {
            const w = max > 0 ? Math.max(0, p.value) / max : 0;
            const x = starts[i];
            return (
              <span
                key={p.label}
                className="asta-meter-a absolute inset-y-0 left-0 w-full origin-left transition-[transform,background-color] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
                style={{ transform: `translateX(${Math.min(1, x) * 100}%) scaleX(${Math.min(w, Math.max(0, 1 - x))})`, background: warn && parts.length === 1 ? "var(--color-ink)" : FILLS[i % FILLS.length] }}
              />
            );
          })}
        </div>
      </div>
      <div className={cx("flex flex-wrap items-center justify-between gap-x-4 gap-y-1", size === "sm" ? "text-[12px]" : "text-[12.5px]")}>
        <p className="tabular-nums text-ink-2">
          <span className="font-medium text-ink">{format(used)}</span>
          <span className="text-mute"> of {format(max)}</span>
        </p>
        {warn ? (
          <p key="warn" className="asta-meter-a flex animate-[asta-meter-fade_.4s_cubic-bezier(.16,1,.3,1)_both] items-center gap-1.5 font-medium text-ink">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01" />
            </svg>
            {warning}
          </p>
        ) : (
          <p className="tabular-nums text-mute">{Math.round(share * 100)}% used</p>
        )}
      </div>
      {legend && segments && segments.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
          {segments.map((p, i) => (
            <li key={p.label} className="flex items-center gap-1.5 text-[12px] text-mute">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: FILLS[i % FILLS.length] }} />
              <span className="text-ink-2">{p.label}</span>
              <span className="tabular-nums">{format(p.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Meter;
