"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface Segment {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SegmentedControlProps {
  segments: Segment[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  /** Stretch to the parent's width, segments sharing it evenly. */
  full?: boolean;
  label?: string;
  className?: string;
}

/**
 * A pill slides between options. While it travels it stretches toward the target and settles back,
 * which reads as a small squash rather than a plain slide. Built on Base UI Radio Group, so ← → move and select.
 */
export function SegmentedControl({ segments, value, defaultValue, onChange, size = "md", full, label, className }: SegmentedControlProps) {
  const [inner, setInner] = useState(defaultValue ?? segments[0]?.value);
  const current = value ?? inner;
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [squash, setSquash] = useState(false);
  const index = Math.max(0, segments.findIndex((s) => s.value === current));

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[index];
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [index]);

  const pick = (v: string) => {
    if (v === current) return;
    setSquash(true);
    setTimeout(() => setSquash(false), 180);
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const h = size === "sm" ? "h-8 text-[13px]" : "h-10 text-[14px]";

  return (
    <RadioGroup
      ref={box}
      value={current}
      onValueChange={(v) => pick(String(v))}
      aria-label={label}
      className={cx(
        "relative inline-flex rounded-[10px] bg-paper-2 p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_6%,transparent)]",
        full && "flex w-full",
        className,
      )}
    >
      {pill && (
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 rounded-[7px] bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.08),0_3px_10px_-4px_rgb(0_0_0/0.18),inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent)] transition-[transform,width] duration-500 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${pill.x}px) scaleY(${squash ? 0.86 : 1})`, width: pill.w }}
        />
      )}
      {segments.map((s, i) => {
        const on = i === index;
        return (
          <Radio.Root
            key={s.value}
            value={s.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cx(
              "relative z-10 inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-brand/50 [&_svg]:h-[1.05em] [&_svg]:w-[1.05em]",
              h,
              size === "sm" ? "px-3" : "px-4",
              full && "flex-1",
              on ? "text-ink" : "text-mute hover:text-ink",
            )}
          >
            {s.icon}
            {s.label}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}

export default SegmentedControl;
