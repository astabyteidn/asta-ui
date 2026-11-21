"use client";

import { useId, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface FloatingLabelTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> {
  label: string;
}

/** aui-004 · The label sits inside the field and floats up once you focus or type. Pure CSS, no state. */
export function FloatingLabelTextarea({ label, className, rows = 4, id, ...rest }: FloatingLabelTextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cx("relative w-full", className)}>
      <textarea
        id={fid}
        rows={rows}
        placeholder=" "
        {...rest}
        className="peer block w-full resize-none rounded-xl bg-paper px-3.5 pb-3 pt-7 text-[16px] sm:text-[14px] leading-[1.55] text-ink outline-none transition-shadow duration-200 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] motion-reduce:transition-none"
      />
      <label
        htmlFor={fid}
        className="pointer-events-none absolute left-3.5 top-0 origin-left translate-y-[18px] text-[14px] text-mute transition-[transform,color] duration-300 ease-[cubic-bezier(.16,1,.3,1)] peer-focus:translate-y-[9px] peer-focus:scale-[.82] peer-focus:text-brand peer-[:not(:placeholder-shown)]:translate-y-[9px] peer-[:not(:placeholder-shown)]:scale-[.82] motion-reduce:transition-none"
      >
        {label}
      </label>
    </div>
  );
}

export default FloatingLabelTextarea;
