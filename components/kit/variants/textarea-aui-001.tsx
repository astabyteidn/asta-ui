"use client";

import { useId, useState, type TextareaHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "maxLength"> {
  label: string;
  /** Helper text under the field. */
  hint?: string;
  /** Character limit. The counter turns amber near it; typing stops at it. */
  maxLength?: number;
  /** Shows "Optional" next to the label. */
  optional?: boolean;
}

/** aui-001 · A labelled textarea with a hint and a live character count. */
export function TextareaField({ label, hint, maxLength, optional, className, rows = 4, id, ...rest }: TextareaFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value) : inner;
  const near = maxLength !== undefined && value.length >= maxLength * 0.9;

  return (
    <div className={cx("flex w-full flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fid} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {optional && <span className="text-[12px] text-mute">Optional</span>}
      </div>
      <textarea
        id={fid}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={hint || maxLength ? `${fid}-meta` : undefined}
        {...rest}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          rest.onChange?.(e);
        }}
        className="block w-full resize-y rounded-xl bg-paper px-3.5 py-3 text-[16px] sm:text-[14px] leading-[1.55] text-ink outline-none transition-shadow duration-200 placeholder:text-mute shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] focus:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)] disabled:opacity-50 motion-reduce:transition-none"
      />
      {(hint || maxLength !== undefined) && (
        <div id={`${fid}-meta`} className="flex items-start justify-between gap-3 text-[12.5px]">
          <span className="text-mute">{hint}</span>
          {maxLength !== undefined && (
            <span className={cx("shrink-0 tabular-nums transition-colors duration-300", near ? "text-[#d97706]" : "text-mute")} aria-live="polite">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TextareaField;
