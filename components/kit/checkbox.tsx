"use client";

import { useId, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type CheckedState = boolean | "indeterminate";

export interface CheckboxProps {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  id?: string;
  name?: string;
  className?: string;
}

/** A checkbox whose tick draws itself in. `indeterminate` shows a dash (for select-all rows). */
export function Checkbox({ checked, defaultChecked = false, onCheckedChange, disabled, label, description, id, name, className }: CheckboxProps) {
  const auto = useId();
  const cid = id ?? auto;
  const [inner, setInner] = useState<CheckedState>(defaultChecked);
  const state = checked ?? inner;
  const on = state === true;
  const mixed = state === "indeterminate";

  const toggle = () => {
    const next = !on; // indeterminate → checked
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };

  const box = (
    <button
      id={cid}
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : on}
      aria-describedby={description ? `${cid}-d` : undefined}
      disabled={disabled}
      onClick={toggle}
      className={cx(
        "group/cb relative grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] outline-none transition-[background-color,box-shadow,transform] duration-200 active:scale-90",
        "focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-45",
        on || mixed
          ? "bg-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.2)]"
          : "bg-paper shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_22%,transparent)] hover:shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-ink)_40%,transparent)]",
      )}
    >
      <svg viewBox="0 0 16 16" className="col-start-1 row-start-1 h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path
          d="M3.5 8.5l3 3 6-7"
          pathLength={1}
          strokeDasharray="1"
          className="transition-[stroke-dashoffset] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none"
          style={{ strokeDashoffset: on ? 0 : 1, transitionDuration: on ? "420ms" : "120ms" }}
        />
      </svg>
      <span
        aria-hidden
        className={cx("col-start-1 row-start-1 h-[2.2px] w-2 rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]", mixed ? "scale-x-100" : "scale-x-0")}
      />
    </button>
  );

  if (!label) return <span className={className}>{box}{name && <input type="hidden" name={name} value={on ? "on" : ""} />}</span>;

  return (
    <div className={cx("flex items-start gap-3", disabled && "opacity-60", className)}>
      <span className="pt-[1px]">{box}</span>
      <span className="min-w-0">
        <label htmlFor={cid} className={cx("block select-none text-[14px] leading-5 text-ink", !disabled && "cursor-pointer")}>
          {label}
        </label>
        {description && (
          <span id={`${cid}-d`} className="mt-0.5 block text-[13px] leading-snug text-mute">
            {description}
          </span>
        )}
      </span>
      {name && <input type="hidden" name={name} value={on ? "on" : ""} />}
    </div>
  );
}

export default Checkbox;
