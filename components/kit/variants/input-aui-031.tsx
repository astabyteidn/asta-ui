"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const ADDON =
  "flex h-full shrink-0 items-center rounded-[7px] bg-paper-2 px-2.5 text-[13.5px] tracking-[-0.01em] text-mute transition-colors duration-300 group-focus-within/a:text-ink-2";

export interface AffixInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "children"> {
  /** Accessible name when there is no visible label pointing at the input. */
  label?: string;
  /** Text or an icon in a chip before the value, e.g. "https://" or "$". */
  prefix?: ReactNode;
  /** Text in a chip after the value, e.g. "USD". */
  suffix?: ReactNode;
  /** Let the suffix ride right after the text, so the whole thing reads as one string (e.g. a subdomain). */
  ride?: boolean;
  /** Units the suffix chip rolls through on click, e.g. ["min", "hours", "days"]. Replaces `suffix`. */
  units?: string[];
  unit?: string;
  onUnitChange?: (unit: string) => void;
  /** Adds a copy button. Copies this string, or prefix + value + suffix when `true`. */
  copy?: boolean | string;
  className?: string;
}

const text = (n: ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : "");

/**
 * aui-031 · Prefix and suffix. Signature: the suffix can ride right behind your text so a subdomain reads
 * as one address, and unit chips roll to the next unit like a counter.
 */
export function AffixInput({
  label = "Site address",
  prefix = "https://",
  suffix = ".astabyte.com",
  ride = true,
  units,
  unit: unitProp,
  onUnitChange,
  copy,
  className,
  placeholder = "studio",
  id,
  ...rest
}: AffixInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value ?? "") : inner;
  const [unitInner, setUnitInner] = useState(units?.[0] ?? "");
  const unit = unitProp ?? unitInner;
  const ui = Math.max(0, units?.indexOf(unit) ?? 0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const nextUnit = () => {
    if (!units?.length) return;
    const u = units[(ui + 1) % units.length];
    if (unitProp === undefined) setUnitInner(u);
    onUnitChange?.(u);
  };

  const doCopy = async () => {
    const s = typeof copy === "string" ? copy : `${text(prefix)}${value || placeholder}${units ? ` ${unit}` : text(suffix)}`;
    try {
      await navigator.clipboard.writeText(s);
    } catch {
      /* Clipboard can be blocked; the check still confirms the press. */
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  const input = (
    <input
      ref={ref}
      id={id}
      aria-label={id ? undefined : label}
      size={1}
      {...rest}
      placeholder={placeholder}
      onChange={(e) => {
        if (!controlled) setInner(e.target.value);
        rest.onChange?.(e);
      }}
      className={cx(
        "h-full min-w-0 bg-transparent text-[14.5px] tracking-[-0.01em] text-ink outline-none placeholder:text-mute",
        ride && suffix && !units ? "col-start-1 row-start-1 w-full" : "w-full flex-1",
      )}
    />
  );

  return (
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.fill !== undefined) {
          e.preventDefault();
          ref.current?.focus();
        }
      }}
      className={cx(
        "group/a flex h-11 w-full cursor-text items-center gap-1 rounded-[10px] bg-paper p-1 text-ink transition-shadow duration-300",
        "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)]",
        "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]",
        rest.disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {prefix && <span className={ADDON}>{prefix}</span>}

      {ride && suffix && !units ? (
        <span data-fill className="flex h-full min-w-0 flex-1 items-center overflow-hidden px-2">
          {/* An invisible copy of the text sizes the input, so the suffix sits right behind the caret. */}
          <span className="inline-grid h-full min-w-[1ch] max-w-[calc(100%-1rem)] items-center">
            <span aria-hidden className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre text-[14.5px] tracking-[-0.01em]">
              {value || placeholder}
            </span>
            {input}
          </span>
          <span data-fill className={cx("shrink-0 whitespace-pre text-[14.5px] tracking-[-0.01em] transition-colors duration-300", value ? "text-ink-2" : "text-mute")}>
            {suffix}
          </span>
        </span>
      ) : (
        <span data-fill className="flex h-full min-w-0 flex-1 items-center px-2">
          {input}
        </span>
      )}

      {units?.length ? (
        <button
          type="button"
          onClick={nextUnit}
          aria-label={`Unit: ${unit}. Change unit`}
          className={cx(ADDON, "group/u relative gap-1.5 overflow-hidden outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50")}
        >
          <span className="relative h-5 overflow-hidden">
            <span className="flex flex-col transition-transform duration-500" style={{ transform: `translateY(${-ui * 1.25}rem)`, transitionTimingFunction: EASE }}>
              {units.map((u) => (
                <span key={u} className="block h-5 leading-5">
                  {u}
                </span>
              ))}
            </span>
            {/* Keeps the chip as wide as its longest unit. */}
            <span aria-hidden className="invisible block h-0 overflow-hidden">
              {units.reduce((a, b) => (b.length > a.length ? b : a), "")}
            </span>
          </span>
          <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform duration-300 group-hover/u:translate-y-px" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 4.5 6 2l2.5 2.5M3.5 7.5 6 10l2.5-2.5" />
          </svg>
        </button>
      ) : (
        suffix && !ride && <span className={ADDON}>{suffix}</span>
      )}

      {copy && (
        <button
          type="button"
          onClick={doCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className="relative grid h-full w-9 shrink-0 place-items-center rounded-[7px] text-mute outline-none transition-[background-color,color,transform] duration-200 hover:bg-paper-2 hover:text-ink active:scale-95 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <svg viewBox="0 0 16 16" className={cx("absolute h-4 w-4 transition-[transform,opacity] duration-300", copied ? "scale-50 opacity-0" : "opacity-100")} style={{ transitionTimingFunction: EASE }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
            <rect x="5.25" y="5.25" width="8" height="8" rx="2" />
            <path d="M10.75 5.25V4.5a1.75 1.75 0 0 0-1.75-1.75H4.5A1.75 1.75 0 0 0 2.75 4.5V9a1.75 1.75 0 0 0 1.75 1.75h.75" />
          </svg>
          <svg viewBox="0 0 16 16" className={cx("absolute h-4 w-4 text-brand transition-opacity duration-200", copied ? "opacity-100" : "opacity-0")} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3.5 8.5l3 3 6-7" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset] duration-500" style={{ strokeDashoffset: copied ? 0 : 1, transitionTimingFunction: EASE }} />
          </svg>
          <span role="status" className="sr-only">
            {copied ? "Copied" : ""}
          </span>
        </button>
      )}
    </div>
  );
}

export default AffixInput;
