"use client";

import { useLayoutEffect, useRef, useState, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Soft character limit: the counter warns near it and turns red past it. */
  limit?: number;
  /** Grow with the content up to this many rows (then scroll). */
  maxRows?: number;
  className?: string;
}

/** Grows as you type and counts down the characters left with a little ring. */
export function Textarea({ limit, maxRows = 10, rows = 3, className, ...rest }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value) : inner;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = "auto";
    const h = Math.min(el.scrollHeight, line * maxRows + pad);
    el.style.height = `${Math.max(h, line * rows + pad)}px`;
    el.style.overflowY = el.scrollHeight > h + 1 ? "auto" : "hidden";
  }, [value, maxRows, rows]);

  const left = limit ? limit - value.length : 0;
  const k = limit ? Math.min(1, value.length / limit) : 0;
  const tone = !limit ? "" : left < 0 ? "#e5484d" : left <= Math.max(10, limit * 0.1) ? "#f5a524" : "var(--color-brand)";
  const C = 2 * Math.PI * 7;

  return (
    <div
      className={cx(
        "relative w-full rounded-xl bg-paper text-ink transition-shadow duration-200",
        left < 0
          ? "shadow-[inset_0_0_0_1px_#e5484d]"
          : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
        rest.disabled && "opacity-50",
        className,
      )}
    >
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={left < 0 || undefined}
        {...rest}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          rest.onChange?.(e);
        }}
        className={cx(
          "block w-full resize-none bg-transparent px-3.5 pt-3 text-[16px] sm:text-[14px] leading-[1.55] outline-none placeholder:text-mute transition-[height] duration-150",
          limit ? "pb-10" : "pb-3",
        )}
      />
      {limit !== undefined && (
        <div className="pointer-events-none absolute bottom-2.5 right-3 flex items-center gap-2" aria-live="polite">
          <span
            className={cx("text-[12px] tabular-nums transition-[opacity,color] duration-300", left > limit * 0.25 ? "opacity-0" : "opacity-100")}
            style={{ color: tone }}
          >
            {left}
          </span>
          <svg viewBox="0 0 18 18" className={cx("h-[18px] w-[18px] -rotate-90 transition-transform duration-300", left < 0 && "scale-110")} aria-hidden>
            <circle cx="9" cy="9" r="7" fill="none" stroke="color-mix(in srgb, var(--color-ink) 12%, transparent)" strokeWidth="2" />
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              stroke={tone}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - k)}
              className="transition-[stroke-dashoffset,stroke] duration-200"
            />
          </svg>
          <span className="sr-only">{left >= 0 ? `${left} characters left` : `${-left} characters over the limit`}</span>
        </div>
      )}
    </div>
  );
}

export default Textarea;
