"use client";

import { useEffect, useRef, useState } from "react";
import { Popover, type PopoverAlign, type PopoverSide } from "@/components/kit/popover";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";

const KEYFRAMES = `@keyframes asta-ctx-in { from { opacity: 0; transform: translateY(3px) } }
@keyframes asta-ctx-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { .asta-ctx-a, .asta-ctx-a * { animation: none !important; transition-duration: 0s !important } }`;

// Segment fills, strongest first: brand, softer brand, then greys. Same order as Meter.
const FILLS = [
  "var(--color-brand)",
  "color-mix(in srgb, var(--color-brand) 55%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 62%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 28%, var(--color-paper))",
  "color-mix(in srgb, var(--color-ink) 14%, var(--color-paper))",
];

export interface ContextSegment {
  label: string;
  tokens: number;
}

export interface ContextBreakdownProps {
  /** What fills the window, e.g. system prompt, tools, files, conversation. */
  segments: ContextSegment[];
  /** Size of the context window in tokens. */
  max: number;
  /** Model name shown in the header. */
  model?: string;
  /** From this share of `max` (0–1) the ring and bar turn ink and a note shows. Default 0.8. */
  warnAt?: number;
  /** Shows "Compact conversation". Return a promise and the button shows progress until it settles. */
  onCompact?: () => void | Promise<void>;
  className?: string;
}

export interface ContextMeterProps extends ContextBreakdownProps {
  /** `sm` shows the ring and percentage only. */
  size?: "sm" | "md";
  side?: PopoverSide;
  align?: PopoverAlign;
}

/** 182600 → "182.6k", 200000 → "200k". */
export const formatTokens = (n: number) => {
  if (n < 1000) return String(Math.round(n));
  const k = n / 1000;
  return `${k >= 100 || Number.isInteger(k) ? Math.round(k) : k.toFixed(1)}k`;
};

/** Glides a number to its new value over 700ms. One short rAF run per change. */
function useTween(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      const id = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const e = 1 - Math.pow(1 - p, 4);
      const v = start + (value - start) * e;
      from.current = v;
      setShown(v);
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return shown;
}

function Ring({ share, warn, className }: { share: number; warn: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx("-rotate-90 shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="6.25" fill="none" strokeWidth="2.5" style={{ stroke: "color-mix(in srgb, var(--color-ink) 11%, transparent)" }} />
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100 100"
        strokeDashoffset={100 - Math.max(share * 100, share > 0 ? 3 : 0)}
        className={cx("transition-[stroke-dashoffset,stroke] duration-700 motion-reduce:transition-none", warn ? "stroke-ink" : "stroke-brand")}
        style={{ transitionTimingFunction: CURVE }}
      />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 2.5 14 13H2zM8 6.5v3M8 11.2h.01" />
    </svg>
  );
}

const sum = (s: ContextSegment[]) => s.reduce((a, p) => a + Math.max(0, p.tokens), 0);

/**
 * The full breakdown of a context window: total used, a segmented bar, a legend per part and a Compact action.
 * When usage drops, the bar glides down and the total counts down to the new value. ContextMeter shows it in a
 * popover; place it on its own in a side panel.
 */
export function ContextBreakdown({ segments, max, model, warnAt = 0.8, onCompact, className }: ContextBreakdownProps) {
  const used = sum(segments);
  const share = max > 0 ? Math.min(1, used / max) : 0;
  const warn = share >= warnAt;
  const shown = useTween(used);
  const [busy, setBusy] = useState(false);
  const [freed, setFreed] = useState(0);
  const [last, setLast] = useState(used);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Say how much a drop freed. Growing again clears the note.
  if (last !== used) {
    setLast(used);
    setFreed(used < last ? last - used : 0);
  }

  const compact = async () => {
    if (!onCompact || busy) return;
    setBusy(true);
    try {
      await onCompact();
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  // Where each part starts, in tokens.
  const starts = segments.map((_, i) => sum(segments.slice(0, i)));
  return (
    <div className={cx("asta-ctx-a flex w-full flex-col gap-3 text-ink", className)}>
      <style href="asta-context-meter" precedence="asta">{KEYFRAMES}</style>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-medium">Context window</p>
        {model && <p className="truncate text-[12px] text-mute">{model}</p>}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="tabular-nums">
          <span className="text-[22px] font-medium tracking-[-0.03em]">{formatTokens(shown)}</span>
          <span className="text-[12.5px] text-mute"> of {formatTokens(max)} tokens</span>
        </p>
        <p className={cx("text-[12.5px] tabular-nums", warn ? "font-medium text-ink" : "text-mute")}>{Math.round((shown / (max || 1)) * 100)}% used</p>
      </div>

      <div
        role="meter"
        aria-label="Context used"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(used, max)}
        aria-valuetext={`${formatTokens(used)} of ${formatTokens(max)} tokens${warn ? ", near the limit" : ""}`}
        className="relative h-2 w-full overflow-hidden rounded-full bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]"
      >
        {segments.map((p, i) => {
          const x = starts[i] / (max || 1);
          const w = Math.max(0, p.tokens) / (max || 1);
          return (
            <span
              key={p.label}
              className="absolute inset-y-0 left-0 w-full origin-left transition-transform duration-700 motion-reduce:transition-none"
              style={{
                transform: `translateX(${Math.min(1, x) * 100}%) scaleX(${Math.min(w, Math.max(0, 1 - x))})`,
                background: FILLS[i % FILLS.length],
                transitionTimingFunction: CURVE,
                boxShadow: "inset -1px 0 0 var(--color-paper)",
              }}
            />
          );
        })}
      </div>

      <ul className="flex flex-col gap-1.5 text-[12.5px]">
        {segments.map((p, i) => (
          <li key={p.label} className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: FILLS[i % FILLS.length] }} />
            <span className="min-w-0 flex-1 truncate text-ink-2">{p.label}</span>
            <span className="tabular-nums text-ink">{formatTokens(p.tokens)}</span>
            <span className="w-9 text-right tabular-nums text-mute">{Math.round((p.tokens / (max || 1)) * 100)}%</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]" />
          <span className="min-w-0 flex-1 truncate text-mute">Free</span>
          <span className="tabular-nums text-ink">{formatTokens(Math.max(0, max - used))}</span>
          <span className="w-9 text-right tabular-nums text-mute">{Math.max(0, 100 - Math.round(share * 100))}%</span>
        </li>
      </ul>

      <p className="sr-only" aria-live="polite">
        {freed > 0 ? `Compacted. Freed ${formatTokens(freed)} tokens.` : busy ? "Compacting conversation." : ""}
      </p>
      {warn ? (
        <p key="warn" className="asta-ctx-a flex gap-1.5 rounded-lg bg-paper-2 px-2.5 py-2 text-[12.5px] leading-snug text-ink animate-[asta-ctx-in_.35s_cubic-bezier(.16,1,.3,1)_both]">
          <WarnIcon />
          <span>
            <span className="font-medium">Near the limit.</span> Older messages get summarised soon. Compact now to choose when.
          </span>
        </p>
      ) : freed > 0 ? (
        <p key={`freed-${freed}`} className="asta-ctx-a text-[12.5px] text-mute animate-[asta-ctx-in_.35s_cubic-bezier(.16,1,.3,1)_both]">
          Freed <span className="font-medium tabular-nums text-ink">{formatTokens(freed)}</span> tokens. The summary keeps decisions and open tasks.
        </p>
      ) : null}

      {onCompact && (
        <button
          type="button"
          onClick={compact}
          aria-busy={busy || undefined}
          disabled={busy || used === 0}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-md bg-paper-2 text-[13px] font-medium text-ink outline-none transition-[background-color,opacity,transform] duration-200 hover:bg-[color-mix(in_srgb,var(--color-ink)_8%,var(--color-paper-2))] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-[asta-ctx-spin_.8s_linear_infinite]" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
              <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h10M3 10h10M8 1.5V4.5L6.5 3M8 4.5 9.5 3M8 14.5v-3L6.5 13M8 11.5l1.5 1.5" />
            </svg>
          )}
          {busy ? "Compacting…" : "Compact conversation"}
        </button>
      )}
    </div>
  );
}

/**
 * How much of the model's context window a conversation uses. A compact ring and "62% of 200k" open a breakdown
 * by part with a Compact action. Near the limit the ring turns ink and the label says so in words.
 */
export function ContextMeter({ size = "md", side = "top", align = "end", ...props }: ContextMeterProps) {
  const { segments, max, warnAt = 0.8 } = props;
  const used = sum(segments);
  const share = max > 0 ? Math.min(1, used / max) : 0;
  const warn = share >= warnAt;
  const pct = Math.round(share * 100);

  return (
    <Popover
      side={side}
      align={align}
      label="Context window"
      className="w-[300px] p-4"
      trigger={
        <button
          type="button"
          aria-label={`Context window: ${pct}% used, ${formatTokens(used)} of ${formatTokens(max)} tokens${warn ? ", near the limit" : ""}`}
          className={cx(
            "asta-ctx-a inline-flex shrink-0 items-center gap-1.5 rounded-md text-[12.5px] tabular-nums outline-none transition-colors duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50 data-[state=open]:bg-paper-2",
            size === "sm" ? "h-7 px-1.5" : "h-8 px-2",
            warn ? "text-ink" : "text-mute hover:text-ink",
          )}
        >
          <Ring share={share} warn={warn} className="h-4 w-4" />
          <span className={cx(warn && "font-medium")}>{pct}%</span>
          {size === "md" && (warn ? <span className="font-medium">· Near limit</span> : <span>of {formatTokens(max)}</span>)}
        </button>
      }
    >
      <ContextBreakdown {...props} />
    </Popover>
  );
}

export default ContextMeter;
