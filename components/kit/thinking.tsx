"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const CURVE = "cubic-bezier(.16,1,.3,1)";
const MASK = "linear-gradient(90deg, transparent 32%, #000 50%, transparent 68%)";

// The shimmer is a soft-edged window that slides across the label while the bright copy inside it slides the other
// way, so the letters stay put and only the light moves. Both are transforms.
const KEYFRAMES = `@keyframes asta-thinking-sweep { from { transform: translateX(-100%) } 70%, to { transform: translateX(100%) } }
@keyframes asta-thinking-counter { from { transform: translateX(100%) } 70%, to { transform: translateX(-100%) } }
@keyframes asta-thinking-in { from { opacity: 0; transform: translateY(4px) } }
@keyframes asta-thinking-pulse { 0%, 100% { opacity: .4 } 50% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .asta-thinking-a, .asta-thinking-a * { animation: none !important; transition-duration: 0s !important } .asta-thinking-shine { display: none } }`;

export type ThinkingStatus = "thinking" | "done" | "stopped";

export interface ThinkingProps {
  /** `thinking` runs the shimmer and the timer. `done` and `stopped` freeze them and fold the panel. */
  status?: ThinkingStatus;
  /** Reasoning summary lines. Append to the array while thinking and each new line fades in. */
  steps?: string[];
  /** One line shown under the header once finished, while folded. Defaults to the last step. */
  summary?: string;
  /** Elapsed seconds, if you track time yourself. Leave it out and the component times itself. */
  seconds?: number;
  /** Label while thinking. */
  label?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** `block` shows a preview line and the panel under the header. `inline` is one line that sits in text, with no panel. */
  variant?: "block" | "inline";
  size?: "sm" | "md";
  className?: string;
}

export const formatThinkingTime = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);

/** Whole seconds since thinking started. Ticks once a second and rests while offscreen or in a hidden tab. */
function useElapsed(running: boolean, el: RefObject<HTMLElement | null>) {
  const [secs, setSecs] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    if (start.current === null) start.current = Date.now();
    const node = el.current;
    let seen = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => setSecs(Math.floor((Date.now() - (start.current ?? Date.now())) / 1000));
    const sync = () => {
      clearInterval(timer);
      timer = undefined;
      tick();
      if (seen && !document.hidden) timer = setInterval(tick, 1000);
    };
    const io = node
      ? new IntersectionObserver(([e]) => {
          seen = e.isIntersecting;
          sync();
        })
      : null;
    if (node) io?.observe(node);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      clearInterval(timer);
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      tick();
    };
  }, [running, el]);
  // The next run starts the clock again.
  useEffect(() => {
    if (running) return;
    return () => {
      start.current = null;
    };
  }, [running]);
  return secs;
}

function Shimmer({ text, on }: { text: string; on: boolean }) {
  return (
    <span className={cx("relative inline-block truncate", on ? "text-mute" : "text-ink")}>
      {text}
      {on && (
        <span aria-hidden className="asta-thinking-shine pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute inset-0 animate-[asta-thinking-sweep_2.2s_linear_infinite]" style={{ maskImage: MASK, WebkitMaskImage: MASK }}>
            <span className="absolute inset-0 animate-[asta-thinking-counter_2.2s_linear_infinite] whitespace-nowrap text-ink">{text}</span>
          </span>
        </span>
      )}
    </span>
  );
}

function Spark({ live, className }: { live: boolean; className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cx(className, "shrink-0", live ? "animate-[asta-thinking-pulse_1.6s_ease-in-out_infinite] text-brand" : "text-mute")} fill="currentColor" aria-hidden>
      <path d="M8 1.5c.4 2.9 1.6 4.1 4.5 4.5-2.9.4-4.1 1.6-4.5 4.5-.4-2.9-1.6-4.1-4.5-4.5C6.4 5.6 7.6 4.4 8 1.5Z" />
      <path d="M12.5 10c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2Z" opacity=".55" />
    </svg>
  );
}

/**
 * Shows that a model is reasoning. The label shimmers and a timer counts up while it thinks, and the reasoning
 * summary streams in line by line inside a disclosure. When it finishes the shimmer stops, the label reads
 * "Thought for 12s" and the panel folds down to one summary line you can open again.
 */
export function Thinking({
  status = "thinking",
  steps = [],
  summary,
  seconds,
  label = "Thinking",
  open,
  defaultOpen = false,
  onOpenChange,
  variant = "block",
  size = "md",
  className,
}: ThinkingProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const live = status === "thinking";
  const own = useElapsed(live && seconds === undefined, root);
  const secs = seconds ?? own;
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean) => {
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };

  // Fold the panel once the run ends, the way a finished thought collapses to its summary.
  const [prev, setPrev] = useState(status);
  if (prev !== status) {
    setPrev(status);
    if (!live && open === undefined) setInner(false);
  }

  const time = formatThinkingTime(secs);
  const heading = live ? label : status === "stopped" ? `Stopped after ${time}` : `Thought for ${time}`;
  const sm = size === "sm";
  const inline = variant === "inline";
  const canOpen = !inline && steps.length > 0;
  const preview = live ? steps[steps.length - 1] : (summary ?? steps[steps.length - 1]);

  const head = (
    <>
      <Spark live={live} className={sm ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <Shimmer text={heading} on={live} />
      {live && <span className="shrink-0 tabular-nums text-mute">{time}</span>}
      {canOpen && (
        <svg
          viewBox="0 0 16 16"
          aria-hidden
          className={cx("h-3.5 w-3.5 shrink-0 text-mute transition-transform duration-300", isOpen && "rotate-90")}
          style={{ transitionTimingFunction: CURVE }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 4 4 4-4 4" />
        </svg>
      )}
    </>
  );

  return (
    <div
      ref={root}
      className={cx("asta-thinking-a min-w-0 text-ink", inline ? "inline-flex max-w-full align-middle" : "flex w-full flex-col", sm ? "text-[12.5px]" : "text-[13.5px]", className)}
    >
      <style href="asta-thinking" precedence="asta">{KEYFRAMES}</style>
      <span className="sr-only" aria-live="polite">
        {live ? `${label}…` : heading.replace(/(\d+)s$/, "$1 seconds")}
      </span>
      {canOpen ? (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen(!isOpen)}
          className="-mx-1.5 flex min-w-0 max-w-full items-center gap-1.5 self-start rounded-md px-1.5 py-1 font-medium outline-none transition-colors duration-200 hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {head}
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-1.5 py-1 font-medium">{head}</span>
      )}

      {!inline && preview && !isOpen && (
        <p key={preview} title={preview} className={cx("asta-thinking-a truncate text-mute animate-[asta-thinking-in_.4s_cubic-bezier(.16,1,.3,1)_both]", sm ? "pl-5" : "pl-[22px]")}>
          {preview}
        </p>
      )}

      {canOpen && (
        <div
          id={`${id}-panel`}
          inert={!isOpen}
          // perf-ok: the disclosure opens by grid rows, like an accordion panel
          className={cx("grid transition-[grid-template-rows,opacity] duration-300", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
          style={{ transitionTimingFunction: CURVE }}
        >
          <div className="min-h-0 overflow-hidden">
            <ol aria-label="Reasoning" className="ml-[7px] mt-1 flex flex-col gap-2 pb-1 pl-[14px] shadow-[inset_1px_0_0_color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
              {steps.map((s, i) => (
                <li key={`${i}-${s}`} className="asta-thinking-a leading-relaxed text-ink-2 animate-[asta-thinking-in_.45s_cubic-bezier(.16,1,.3,1)_both]">
                  {s}
                  {live && i === steps.length - 1 && (
                    <span aria-hidden className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle animate-[asta-thinking-pulse_1.2s_ease-in-out_infinite]" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default Thinking;
