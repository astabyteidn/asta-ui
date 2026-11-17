"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface NumberInputProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  /** Text after the number, e.g. "seats" or "kg". */
  suffix?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/** One digit as a vertical strip of 0–9 that rolls to its new position. */
function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-block h-[1.25em] w-[0.62em] overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(${-d * 1.25}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="flex h-[1.25em] items-center justify-center">
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * A stepper. Hold − or + and it repeats, faster the longer you hold. Arrow keys step, Page Up/Down step by
 * ten, Home/End jump to min/max, and typing digits enters a value.
 */
export function NumberInput({ value, defaultValue = 0, onChange, min = 0, max = 999, step = 1, label, suffix, size = "md", className }: NumberInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const latest = useRef(current);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typed = useRef({ text: "", at: 0 });
  const [bump, setBump] = useState<"min" | "max" | null>(null);

  useEffect(() => {
    latest.current = current;
  }, [current]);

  const set = (v: number) => {
    const next = Math.min(max, Math.max(min, v));
    if (next === latest.current) {
      // Already at a limit: nudge to say so.
      setBump(v < min ? "min" : v > max ? "max" : null);
      setTimeout(() => setBump(null), 260);
      return false;
    }
    latest.current = next;
    if (value === undefined) setInner(next);
    onChange?.(next);
    return true;
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const hold = (dir: 1 | -1) => {
    stop();
    set(latest.current + dir * step);
    let delay = 380;
    const tick = () => {
      if (!set(latest.current + dir * step)) return stop();
      delay = Math.max(40, delay * 0.82);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, delay);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") set(current + step);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") set(current - step);
    else if (e.key === "PageUp") set(current + step * 10);
    else if (e.key === "PageDown") set(current - step * 10);
    else if (e.key === "Home") set(min);
    else if (e.key === "End") set(max);
    else if (/^[0-9]$/.test(e.key)) {
      const now = e.timeStamp;
      const text = (now - typed.current.at > 900 ? "" : typed.current.text) + e.key;
      typed.current = { text, at: now };
      set(Number(text));
    } else return;
    e.preventDefault();
  };

  const digits = String(Math.abs(Math.round(current))).split("").map(Number);
  const big = size === "md";

  const btn = (dir: 1 | -1) => {
    const off = dir === 1 ? current >= max : current <= min;
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={dir === 1 ? "Increase" : "Decrease"}
        disabled={off}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          hold(dir);
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onContextMenu={(e) => e.preventDefault()}
        className={cx(
          "flex shrink-0 select-none items-center justify-center rounded-md text-ink-2 outline-none transition-[background-color,transform,opacity] duration-150 [touch-action:manipulation] hover:bg-paper-2 hover:text-ink active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent",
          big ? "h-8 w-8" : "h-6 w-6",
        )}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          {dir === 1 ? <path d="M8 3.5v9M3.5 8h9" /> : <path d="M3.5 8h9" />}
        </svg>
      </button>
    );
  };

  return (
    <div
      className={cx(
        "inline-flex items-center gap-1 bg-paper shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
        big ? "h-12 rounded-[10px] px-2" : "h-8 rounded-full px-1",
        className,
      )}
    >
      {btn(-1)}
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={onKey}
        className={cx(
          "flex min-w-[3.5em] items-center justify-center gap-1.5 rounded-lg px-1 font-medium tabular-nums tracking-[-0.02em] text-ink outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-accent/50",
          big ? "text-[20px]" : "text-[14px]",
          bump === "max" && "-translate-y-0.5",
          bump === "min" && "translate-y-0.5",
        )}
      >
        <span className="inline-flex">
          {current < 0 && "−"}
          {digits.map((d, i) => (
            <Digit key={digits.length - i} d={d} />
          ))}
        </span>
        {suffix && <span className={cx("font-normal text-mute", big ? "text-[13px]" : "text-[12px]")}>{suffix}</span>}
      </div>
      {btn(1)}
    </div>
  );
}

export default NumberInput;
