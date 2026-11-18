"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface ToggleGroupOption {
  value: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Accessible name, needed when the option is icon-only. */
  "aria-label"?: string;
}

interface ToggleGroupBase {
  options: ToggleGroupOption[];
  size?: "sm" | "md";
  /** Stretch to the parent's width, options sharing it evenly. */
  full?: boolean;
  disabled?: boolean;
  /** Accessible name for the group, e.g. "Text alignment". */
  label?: string;
  className?: string;
}

export interface ToggleGroupSingleProps extends ToggleGroupBase {
  type?: "single";
  /** The pressed option. An empty string means none. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Pressing the active option again clears it. */
  allowEmpty?: boolean;
}

export interface ToggleGroupMultipleProps extends ToggleGroupBase {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type ToggleGroupProps = ToggleGroupSingleProps | ToggleGroupMultipleProps;

const EASE = "cubic-bezier(.16,1,.3,1)";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A row of toggle buttons. In single mode one stays pressed and its background slides over from the last
 * one. In multiple mode each pressed button fills on its own. Arrow keys move focus (and select, in single mode),
 * Space or Enter presses.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { options, size = "md", full, disabled, label, className } = props;
  const multiple = props.type === "multiple";

  const [innerOne, setInnerOne] = useState(!multiple ? (props.defaultValue ?? "") : "");
  const [innerMany, setInnerMany] = useState<string[]>(multiple ? (props.defaultValue ?? []) : []);
  const one = !multiple ? (props.value ?? innerOne) : "";
  const many = multiple ? (props.value ?? innerMany) : [];
  const isOn = (v: string) => (multiple ? many.includes(v) : one === v);

  const root = useRef<HTMLDivElement>(null);
  const prevOne = useRef(one);
  const enabled = options.filter((o) => !o.disabled && !disabled);

  // Roving tab stop: the focused option, else the first pressed one, else the first enabled one.
  const [focusVal, setFocusVal] = useState<string | null>(null);
  const stop =
    (focusVal !== null && enabled.some((o) => o.value === focusVal) && focusVal) ||
    enabled.find((o) => isOn(o.value))?.value ||
    enabled[0]?.value;

  const press = (v: string) => {
    if (multiple) {
      const next = many.includes(v) ? many.filter((x) => x !== v) : [...many, v];
      // Keep the options' order so the value is stable whatever the click order.
      const ordered = options.map((o) => o.value).filter((x) => next.includes(x));
      if (props.value === undefined) setInnerMany(ordered);
      props.onValueChange?.(ordered);
    } else {
      const next = one === v ? (props.allowEmpty ? "" : v) : v;
      if (next === one) return;
      if (props.value === undefined) setInnerOne(next);
      props.onValueChange?.(next);
    }
  };

  // Single mode: FLIP the new background from the old button's box, so it slides with transform only.
  useLayoutEffect(() => {
    if (multiple) return;
    const from = prevOne.current;
    prevOne.current = one;
    if (from === one || !one || !root.current) return;
    const btns = Array.from(root.current.querySelectorAll<HTMLElement>("[data-tg-value]"));
    const next = btns.find((b) => b.dataset.tgValue === one);
    const prev = btns.find((b) => b.dataset.tgValue === from);
    const ind = next?.querySelector<HTMLElement>("[data-tg-ind]");
    if (!next || !ind || reduced()) return;
    ind.style.transition = "none";
    if (prev && prev.offsetWidth) {
      const dx = prev.offsetLeft - next.offsetLeft;
      const s = prev.offsetWidth / next.offsetWidth;
      ind.style.transform = `translateX(${dx}px) scaleX(${s})`;
    } else {
      ind.style.opacity = "0";
      ind.style.transform = "scale(.94)";
    }
    void ind.offsetWidth;
    ind.style.transition = `transform .44s ${EASE}, opacity .25s ${EASE}`;
    ind.style.transform = "";
    ind.style.opacity = "";
  }, [one, multiple]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key) || !enabled.length) return;
    e.preventDefault();
    const at = enabled.findIndex((o) => o.value === stop);
    let i = at;
    if (e.key === "Home") i = 0;
    else if (e.key === "End") i = enabled.length - 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") i = (at + 1) % enabled.length;
    else i = (at - 1 + enabled.length) % enabled.length;
    const v = enabled[i].value;
    setFocusVal(v);
    root.current?.querySelector<HTMLElement>(`[data-tg-value="${CSS.escape(v)}"]`)?.focus();
    // Single mode is a radio group: moving selects, like native radios.
    if (!multiple && v !== one) press(v);
  };

  const h = size === "sm" ? "h-8 text-[13px]" : "h-9 text-[13.5px]";

  return (
    <div
      ref={root}
      role={multiple ? "group" : "radiogroup"}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={onKey}
      className={cx(
        "relative inline-flex gap-0.5 rounded-[10px] bg-paper-2 p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]",
        full && "flex w-full",
        disabled && "opacity-50",
        className,
      )}
    >
      {options.map((o) => {
        const on = isOn(o.value);
        const off = disabled || o.disabled;
        return (
          <button
            key={o.value}
            type="button"
            data-tg-value={o.value}
            role={multiple ? undefined : "radio"}
            aria-checked={multiple ? undefined : on}
            aria-pressed={multiple ? on : undefined}
            aria-label={o["aria-label"]}
            disabled={off}
            tabIndex={o.value === stop ? 0 : -1}
            onFocus={() => setFocusVal(o.value)}
            onClick={() => press(o.value)}
            className={cx(
              "group/tg relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium tracking-[-0.01em] outline-none transition-[color,scale] duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.97] disabled:pointer-events-none motion-reduce:transition-none [&_svg]:h-[1.05em] [&_svg]:w-[1.05em]",
              h,
              o.label ? (size === "sm" ? "px-3" : "px-3.5") : size === "sm" ? "w-8" : "w-9",
              full && "flex-1",
              on ? "text-ink" : "text-mute hover:text-ink",
              o.disabled && !disabled && "opacity-40",
            )}
          >
            <span
              aria-hidden
              data-tg-ind
              className={cx(
                "pointer-events-none absolute inset-0 origin-left rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.07),0_3px_10px_-4px_rgb(0_0_0/0.16),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]",
                // Multiple mode fades each background on its own. Single mode is driven by the FLIP above.
                multiple && "transition-[opacity,scale] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
                on ? "scale-100 opacity-100" : multiple ? "scale-[.94] opacity-0" : "opacity-0",
              )}
            />
            {o.icon && <span className={cx("relative flex transition-colors duration-200", on && "text-brand")}>{o.icon}</span>}
            {o.label && <span className="relative">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default ToggleGroup;
