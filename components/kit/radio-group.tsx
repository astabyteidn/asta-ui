"use client";

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  /** Shown on the right of a card, e.g. a price. */
  aside?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** `cards` (default): option cards with a ring that glides to the selection. `list`: compact rows. */
  variant?: "cards" | "list";
  /** Cards per row on wider screens. */
  columns?: 1 | 2 | 3;
  label?: string;
  name?: string;
  className?: string;
}

const RING = "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)]";

/** Choose one. Arrow keys move and select (roving focus), like native radios. */
export function RadioGroup({ options, value, defaultValue, onChange, variant = "cards", columns = 3, label, name, className }: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue ?? options.find((o) => !o.disabled)?.value ?? "");
  const current = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const [glide, setGlide] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const uid = useId();

  const pick = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const index = Math.max(0, options.findIndex((o) => o.value === current));

  useLayoutEffect(() => {
    if (variant !== "cards") return;
    const measure = () => {
      const el = refs.current[index];
      if (el) setGlide({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [index, variant]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    let n = i;
    for (let k = 0; k < options.length; k++) {
      n = (n + step + options.length) % options.length;
      if (!options[n].disabled) break;
    }
    pick(options[n].value);
    refs.current[n]?.focus();
  };

  const grid = columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";

  return (
    <div
      ref={box}
      role="radiogroup"
      aria-label={label}
      className={cx("relative", variant === "cards" ? `grid gap-2.5 ${grid}` : `flex flex-col rounded-xl bg-paper p-1.5 ${RING}`, className)}
    >
      {variant === "cards" && glide && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 rounded-xl shadow-[inset_0_0_0_2px_var(--color-accent),0_0_0_4px_color-mix(in_srgb,var(--color-accent)_14%,transparent)] transition-[transform,width,height] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
          style={{ transform: `translate(${glide.x}px, ${glide.y}px)`, width: glide.w, height: glide.h }}
        />
      )}
      {options.map((o, i) => {
        const on = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={o.disabled || undefined}
            disabled={o.disabled}
            tabIndex={on ? 0 : -1}
            name={name}
            id={`${uid}-${i}`}
            onClick={() => pick(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cx(
              "group/radio relative flex text-left outline-none transition-[background-color,box-shadow,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-45",
              variant === "cards"
                ? cx("flex-col gap-1 rounded-xl bg-paper p-4", RING, !on && "hover:bg-paper-2")
                : cx("flex-col gap-0.5 rounded-lg px-3 py-2.5", on ? "bg-paper-2" : "hover:bg-paper-2/60"),
            )}
          >
            <span className="flex w-full items-center gap-3">
              <Dot on={on} />
              <span className="min-w-0 flex-1 text-[14px] font-medium tracking-[-0.01em] text-ink">{o.label}</span>
              {o.aside && <span className="text-[13px] tabular-nums text-ink-2">{o.aside}</span>}
            </span>
            {o.description && <span className={cx("text-[13px] leading-snug text-mute", "pl-7")}>{o.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** The radio circle: the inner dot pops in with a small overshoot. */
export function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-300",
        on ? "bg-accent shadow-none" : "bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] group-hover/radio:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_40%,transparent)]",
      )}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(.34,1.8,.64,1)] motion-reduce:transition-none",
          on ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}

export default RadioGroup;
