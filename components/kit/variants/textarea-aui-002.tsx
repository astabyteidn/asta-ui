"use client";

import { useLayoutEffect, useRef, useState, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface AutoGrowTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Smallest height, in rows. */
  minRows?: number;
  /** Tallest height before it scrolls, in rows. */
  maxRows?: number;
}

/**
 * aui-002 · Grows with its content and eases to the new height. A hidden mirror measures the text, so the
 * textarea never snaps to `height: auto` and the transition stays smooth.
 */
export function AutoGrowTextarea({ minRows = 2, maxRows = 8, className, ...rest }: AutoGrowTextareaProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value) : inner;

  useLayoutEffect(() => {
    const el = area.current;
    const m = mirror.current;
    if (!el || !m) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const line = parseFloat(cs.lineHeight) || 21;
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      m.style.width = `${el.clientWidth}px`;
      const content = m.offsetHeight;
      const min = line * minRows + pad;
      const max = line * maxRows + pad;
      el.style.height = `${Math.min(max, Math.max(min, content))}px`;
      el.style.overflowY = content > max ? "auto" : "hidden";
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, minRows, maxRows]);

  const text = "block w-full px-3.5 py-3 text-[16px] sm:text-[14px] leading-[1.55] whitespace-pre-wrap break-words";

  return (
    <div className={cx("relative w-full", className)}>
      <textarea
        ref={area}
        rows={minRows}
        {...rest}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          rest.onChange?.(e);
        }}
        className={cx(
          text,
          "resize-none rounded-xl bg-paper text-ink outline-none placeholder:text-mute transition-[height,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
        )}
      />
      <div ref={mirror} aria-hidden className={cx(text, "pointer-events-none invisible absolute left-0 top-0")}>
        {value + "​"}
      </div>
    </div>
  );
}

export default AutoGrowTextarea;
