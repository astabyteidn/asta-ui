"use client";

import { useEffect, useRef, useState } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-cd-in { from { transform: translateY(-62%); opacity: 0 } }
@keyframes asta-cd-out { to { transform: translateY(62%); opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .asta-cd-a { animation: none !important } .asta-cd-old { display: none } }`;

export type CountdownUnit = "d" | "h" | "m" | "s";

const UNIT_MS: Record<CountdownUnit, number> = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000 };
const NAMES: Record<CountdownUnit, [string, string]> = { d: ["day", "days"], h: ["hour", "hours"], m: ["minute", "minutes"], s: ["second", "seconds"] };
const SHORT: Record<CountdownUnit, string> = { d: "Days", h: "Hours", m: "Min", s: "Sec" };

export interface CountdownProps {
  /** The moment it counts down to: a Date, a timestamp in ms, or an ISO string. */
  to: Date | number | string;
  /** Which units to show, biggest first. The biggest one soaks up the rest, e.g. ["h","m","s"] shows 49 hours. */
  units?: CountdownUnit[];
  /** `boxed` puts each unit on a tile with a label under it. `inline` reads like a clock, 04:59. */
  variant?: "boxed" | "inline";
  size?: "sm" | "md" | "lg";
  /** Called once when it reaches zero. */
  onComplete?: () => void;
  /** Accessible name in front of the time, e.g. "Sale ends in". */
  label?: string;
  className?: string;
}

const toMs = (t: CountdownProps["to"]) => (t instanceof Date ? t.getTime() : typeof t === "string" ? Date.parse(t) : t);

/** Splits what's left into the units shown. The first unit takes everything above it. */
function split(left: number, units: CountdownUnit[]) {
  let rest = Math.max(0, left);
  return units.map((u) => {
    const n = Math.floor(rest / UNIT_MS[u]);
    rest -= n * UNIT_MS[u];
    return n;
  });
}

/** One digit. The old one drops out below while the new one drops in from above. */
function Digit({ d }: { d: string }) {
  const [state, setState] = useState({ cur: d, prev: "", n: 0 });
  if (state.cur !== d) setState({ cur: d, prev: state.cur, n: state.n + 1 });
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center leading-[1em]">
      {state.n > 0 && (
        <span key={`o${state.n}`} className="asta-cd-a asta-cd-old absolute inset-0 animate-[asta-cd-out_.5s_cubic-bezier(.16,1,.3,1)_both]">
          {state.prev}
        </span>
      )}
      <span key={`n${state.n}`} className={cx("asta-cd-a block", state.n > 0 && "animate-[asta-cd-in_.5s_cubic-bezier(.16,1,.3,1)_both]")}>
        {state.cur}
      </span>
    </span>
  );
}

const SIZE = {
  sm: { num: "text-[15px]", tile: "min-w-[38px] rounded-md px-1.5 py-1.5", label: "text-[9.5px]", gap: "gap-1.5" },
  md: { num: "text-[24px]", tile: "min-w-[56px] rounded-[10px] px-2 py-2.5", label: "text-[10.5px]", gap: "gap-2" },
  lg: { num: "text-[40px]", tile: "min-w-[80px] rounded-xl px-3 py-3.5", label: "text-[11px]", gap: "gap-2.5" },
};

/**
 * Time left until a moment, in days, hours, minutes and seconds. Each digit rolls down to the next one as it
 * changes. It ticks once a second, and stops while it is offscreen or the tab is hidden.
 */
export function Countdown({ to, units = ["d", "h", "m", "s"], variant = "boxed", size = "md", onComplete, label = "Time left", className }: CountdownProps) {
  const target = toMs(to);
  const root = useRef<HTMLSpanElement>(null);
  const [now, setNow] = useState<number | null>(null);
  const done = useRef(false);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  });

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    done.current = false;
    let id = 0;
    let visible = true;
    const stop = () => {
      window.clearInterval(id);
      id = 0;
    };
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= target) {
        stop();
        if (!done.current) {
          done.current = true;
          complete.current?.();
        }
      }
    };
    const sync = () => {
      const run = visible && !document.hidden && Date.now() < target;
      if (run && !id) {
        tick();
        id = window.setInterval(tick, 1000);
      } else if (!run) {
        stop();
        if (Date.now() >= target) tick();
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [target]);

  const parts = now === null ? units.map(() => 0) : split(target - now, units);
  const ready = now !== null;
  const spoken = units
    .map((u, i) => (i < units.length - 1 || u !== "s" ? `${parts[i]} ${NAMES[u][parts[i] === 1 ? 0 : 1]}` : ""))
    .filter(Boolean)
    .join(" ");
  const s = SIZE[size];

  return (
    <span
      ref={root}
      role="timer"
      aria-label={ready ? `${label}: ${spoken}` : label}
      className={cx("inline-flex items-start font-medium tabular-nums tracking-[-0.03em] text-ink transition-opacity duration-500", variant === "boxed" && s.gap, !ready && "opacity-0", className)}
    >
      <style href="asta-countdown" precedence="asta">{KEYFRAMES}</style>
      {units.map((u, i) => {
        const text = String(parts[i]).padStart(2, "0");
        const digits = (
          <span aria-hidden className={cx("inline-flex leading-none", s.num)}>
            {text.split("").map((d, k) => (
              <Digit key={text.length - k} d={d} />
            ))}
          </span>
        );
        if (variant === "inline")
          return (
            <span key={u} className="inline-flex items-start">
              {i > 0 && (
                <span aria-hidden className={cx("-mt-[0.06em] px-[0.08em] leading-none text-mute", s.num)}>
                  :
                </span>
              )}
              {digits}
            </span>
          );
        return (
          <span key={u} className="flex flex-col items-center gap-1.5">
            <span className={cx("flex justify-center bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]", s.tile)}>{digits}</span>
            <span aria-hidden className={cx("font-mono uppercase tracking-wider text-mute", s.label)}>
              {SHORT[u]}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default Countdown;
