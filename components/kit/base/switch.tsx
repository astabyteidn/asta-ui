"use client";

import { Switch as Sw } from "@base-ui/react/switch";
import { useId, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type SwitchSize = "sm" | "md" | "lg";

// Track width / height and thumb size, in px.
const DIM: Record<SwitchSize, { w: number; h: number; t: number }> = {
  sm: { w: 30, h: 18, t: 14 },
  md: { w: 40, h: 24, t: 20 },
  lg: { w: 52, h: 30, t: 26 },
};

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  id?: string;
  /** Form field name. */
  name?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * An on/off switch on Base UI Switch (ARIA, Space/Enter, native form value through `name`). While pressed the
 * thumb stretches toward where it's about to go.
 */
export function Switch({ checked, defaultChecked = false, onCheckedChange, size = "md", disabled, label, description, id, name, className, "aria-label": ariaLabel }: SwitchProps) {
  const auto = useId();
  const sid = id ?? auto;
  const [inner, setInner] = useState(defaultChecked);
  const [press, setPress] = useState(false);
  const on = checked ?? inner;
  const { w, h, t } = DIM[size];
  const pad = (h - t) / 2;
  const stretch = press ? t * 0.3 : 0;
  const x = on ? w - pad * 2 - t - stretch : 0;

  const control = (
    <Sw.Root
      id={sid}
      name={name}
      checked={on}
      onCheckedChange={(v) => {
        if (checked === undefined) setInner(v);
        onCheckedChange?.(v);
      }}
      aria-label={ariaLabel}
      aria-describedby={description ? `${sid}-d` : undefined}
      disabled={disabled}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setPress(true)}
      onKeyUp={() => setPress(false)}
      onBlur={() => setPress(false)}
      className={cx(
        "relative shrink-0 rounded-full outline-none transition-[background-color,box-shadow] duration-300",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-45",
        on ? "bg-brand shadow-[inset_0_1px_2px_rgb(0_0_0/0.15)]" : "bg-[color-mix(in_srgb,var(--color-ink)_14%,var(--color-paper))] shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]",
      )}
      style={{ width: w, height: h, padding: pad }}
    >
      <Sw.Thumb
        className="block rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_2px_6px_-1px_rgb(0_0_0/0.18)] transition-[transform,width] duration-[450ms] ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none"
        style={{ width: t + stretch, height: t, transform: `translateX(${x}px)` }}
      />
    </Sw.Root>
  );

  if (!label) return <span className={className}>{control}</span>;
  return (
    <div className={cx("flex items-center justify-between gap-4", disabled && "opacity-60", className)}>
      <span className="min-w-0">
        <label htmlFor={sid} className={cx("block select-none text-[14px] leading-5 text-ink", !disabled && "cursor-pointer")}>
          {label}
        </label>
        {description && (
          <span id={`${sid}-d`} className="mt-0.5 block text-[13px] leading-snug text-mute">
            {description}
          </span>
        )}
      </span>
      {control}
    </div>
  );
}

export default Switch;
