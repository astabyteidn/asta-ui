"use client";

import { useEffect, useRef, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type TimelineState = "done" | "active" | "pending";

export interface TimelineItem {
  title: ReactNode;
  description?: ReactNode;
  /** A short time label, e.g. "09:41" or "Mon 12". */
  time?: ReactNode;
  /** Default `done`. `active` gets a soft blue pulse, `pending` a hollow dot and muted text. */
  state?: TimelineState;
}

export interface TimelineProps {
  items: TimelineItem[];
  /** Reveal the items one after another when the list scrolls into view. */
  animate?: boolean;
  /** Accessible name for the list. */
  label?: string;
  className?: string;
}

const KEYFRAMES = `@keyframes asta-timeline-in { from { opacity: 0; transform: translateY(8px) } }
@keyframes asta-timeline-line { from { transform: scaleY(0) } }
@keyframes asta-timeline-ping { 0% { opacity: .45; transform: scale(1) } 70%, 100% { opacity: 0; transform: scale(2.6) } }
.asta-timeline[data-inview="false"] .asta-timeline-a { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) { .asta-timeline .asta-timeline-a, .asta-timeline .asta-timeline-ping { animation: none !important } }`;

function Dot({ state }: { state: TimelineState }) {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      {state === "active" && <span aria-hidden className="asta-timeline-ping absolute h-2.5 w-2.5 rounded-full bg-brand animate-[asta-timeline-ping_2.4s_cubic-bezier(.16,1,.3,1)_infinite]" />}
      <span
        aria-hidden
        className={cx(
          "relative h-2.5 w-2.5 rounded-full",
          state === "done" && "bg-ink",
          state === "active" && "bg-brand shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
          state === "pending" && "bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)]",
        )}
      />
    </span>
  );
}

/**
 * A vertical list of events with dots on a connector line. Items rise in one after another when the list
 * scrolls into view, the line between finished steps draws down, and the active step pulses softly.
 */
export function Timeline({ items, animate = true, label = "Timeline", className }: TimelineProps) {
  const ref = useRef<HTMLOListElement>(null);

  // Hold the reveal until the list is on screen. Written to a data attribute, so no re-render.
  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.inview = "true";
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  return (
    <ol ref={ref} aria-label={label} data-inview={animate ? "false" : "true"} className={cx("asta-timeline flex flex-col", className)}>
      <style href="asta-timeline" precedence="asta">{KEYFRAMES}</style>
      {items.map((item, i) => {
        const state = item.state ?? "done";
        const last = i === items.length - 1;
        const next = items[i + 1]?.state ?? "done";
        // The line under a dot is "travelled" once the next step has started.
        const travelled = state === "done" && next !== "pending";
        return (
          <li
            key={i}
            aria-current={state === "active" ? "step" : undefined}
            className={cx("relative flex gap-3.5", animate && "asta-timeline-a animate-[asta-timeline-in_.6s_cubic-bezier(.16,1,.3,1)_both]")}
            style={animate ? { animationDelay: `${i * 90}ms` } : undefined}
          >
            <div className="relative flex w-5 shrink-0 flex-col items-center">
              <Dot state={state} />
              {!last && (
                <span aria-hidden className="relative -mb-0.5 mt-0.5 w-px flex-1 overflow-hidden bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
                  {travelled && (
                    <span
                      className={cx("absolute inset-0 origin-top bg-ink", animate && "asta-timeline-a animate-[asta-timeline-line_.7s_cubic-bezier(.16,1,.3,1)_both]")}
                      style={animate ? { animationDelay: `${i * 90 + 200}ms` } : undefined}
                    />
                  )}
                </span>
              )}
            </div>
            <div className={cx("min-w-0 flex-1", !last && "pb-6")}>
              <div className="flex items-baseline justify-between gap-4">
                <p className={cx("text-[14px] font-medium leading-5 tracking-[-0.01em]", state === "pending" ? "text-mute" : "text-ink")}>
                  {item.title}
                  <span className="sr-only">{state === "active" ? ", in progress" : state === "pending" ? ", not started" : ", done"}</span>
                </p>
                {item.time && <span className={cx("shrink-0 text-[12px] tabular-nums", state === "active" ? "text-brand" : "text-mute")}>{item.time}</span>}
              </div>
              {item.description && <div className="mt-0.5 text-[13px] leading-relaxed text-mute">{item.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default Timeline;
