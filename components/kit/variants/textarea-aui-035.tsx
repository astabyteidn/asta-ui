"use client";

import { useId, useRef, useState, type CSSProperties } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const CSS = `
@keyframes aui035-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes aui035-pop { 0% { transform: scale(1) } 40% { transform: scale(1.2) } 100% { transform: scale(1) } }
@keyframes aui035-num { from { opacity: 0; transform: translateY(5px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui035 * { animation: none !important; transition: none !important } }
`;
const rise = (i: number): CSSProperties => ({ animation: `aui035-rise .6s ${EASE} ${i * 50}ms both` });

export interface BudgetTextareaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Soft limit. You can type past it, the extra text is marked and the ring flips. */
  limit?: number;
  /** The ring shows the remaining count once this many characters are left. */
  warnAt?: number;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * aui-035 · A textarea on a character budget. Signature: a ring fills as you type, turns into a countdown near the
 * end and pops when you pass the soft limit, while the text past the limit gets a blue wash you can still send.
 */
export function BudgetTextarea({
  value,
  defaultValue = "",
  onChange,
  limit = 160,
  warnAt = 20,
  label = "Status update",
  placeholder = "What changed this week?",
  rows = 4,
  className,
}: BudgetTextareaProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const mirror = useRef<HTMLDivElement>(null);
  // Count code points so an emoji counts as one.
  const chars = [...text];
  const n = chars.length;
  const left = limit - n;
  const over = left < 0;
  const near = !over && left <= warnAt;
  const R = 9;
  const C = 2 * Math.PI * R;
  const ratio = Math.min(n / limit, 1);
  const head = chars.slice(0, limit).join("");
  const tail = chars.slice(limit).join("");

  return (
    <div className={cx("aui035 w-full max-w-[460px]", className)}>
      <style href="asta-textarea-aui-035" precedence="asta">{CSS}</style>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-[13px] font-medium text-ink" style={rise(0)}>
        {label}
        <span className="font-mono text-[11px] font-normal uppercase tracking-[0.08em] text-mute">{limit} chars</span>
      </label>
      <div
        className={cx(
          "relative rounded-[12px] bg-paper transition-shadow duration-300",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_12%,transparent),0_1px_2px_rgb(0_0_0/0.04)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_22%,transparent),0_1px_2px_rgb(0_0_0/0.04)]",
          "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]",
        )}
        style={rise(1)}
      >
        <div className="relative">
        {/* Mirror with the same metrics as the textarea: transparent text, only the overflow is painted. */}
        <div
          ref={mirror}
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-4 pb-2 pt-3.5 text-[16px] sm:text-[14.5px] leading-[1.6] text-transparent"
        >
          {head}
          <mark className="rounded-[3px] bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] text-transparent shadow-[0_1.5px_0_var(--color-brand)]">{tail}</mark>
          {"​"}
        </div>
        <textarea
          id={id}
          rows={rows}
          value={text}
          placeholder={placeholder}
          aria-describedby={`${id}-count`}
          onScroll={(e) => {
            if (mirror.current) mirror.current.scrollTop = e.currentTarget.scrollTop;
          }}
          onChange={(e) => {
            if (value === undefined) setInner(e.target.value);
            onChange?.(e.target.value);
          }}
          className="relative block w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[16px] sm:text-[14.5px] leading-[1.6] text-ink outline-none placeholder:text-mute"
        />
        </div>
        <div className="pointer-events-none flex items-center justify-end gap-2.5 px-3 pb-2.5">
          <span
            className={cx("text-[12px] transition-[opacity,transform] duration-300", over ? "opacity-100" : "translate-x-1 opacity-0")}
            style={{ transitionTimingFunction: EASE }}
          >
            <span className="font-medium tabular-nums text-ink">{Math.max(-left, 0)}</span> <span className="text-mute">over the soft limit</span>
          </span>
          <span key={over ? "over" : "ok"} className="relative grid h-7 w-7 place-items-center" style={over ? { animation: `aui035-pop .45s ${EASE} both` } : undefined}>
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-7 w-7 -rotate-90" aria-hidden>
              <circle cx="12" cy="12" r={R} strokeWidth="2.25" className={cx("stroke-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] transition-colors duration-300", over ? "fill-ink" : "fill-transparent")} />
              <circle
                cx="12"
                cy="12"
                r={R}
                fill="none"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - ratio)}
                className={cx(over ? "stroke-ink" : near ? "stroke-brand" : "stroke-[color-mix(in_srgb,var(--color-ink)_45%,transparent)]", n === 0 && "opacity-0")}
              />
            </svg>
            {over && (
              <span className="relative text-[12px] font-semibold leading-none text-paper" style={{ animation: `aui035-num .25s ${EASE} both` }}>
                !
              </span>
            )}
            {near && (
              <span key={left} className="relative text-[10px] font-semibold tabular-nums text-brand" style={{ animation: `aui035-num .25s ${EASE} both` }}>
                {left}
              </span>
            )}
          </span>
        </div>
      </div>
      <p id={`${id}-count`} className="sr-only" aria-live="polite">
        {over ? `${-left} characters over the limit` : near ? `${left} characters left` : ""}
      </p>
    </div>
  );
}

export default BudgetTextarea;
