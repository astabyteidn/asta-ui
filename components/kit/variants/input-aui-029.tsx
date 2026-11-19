"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const CSS = `
@keyframes aui029-in { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) { .aui029 * { animation: none !important; transition: none !important } }
`;

export interface FloatingInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "children"> {
  label?: string;
  /** Help text under the field. */
  hint?: ReactNode;
  /** A message in ink, not red. Replaces the hint while set. */
  error?: ReactNode;
  /** Shown before the text, e.g. an icon. */
  start?: ReactNode;
  /** Shown after the text, e.g. a unit or a button. */
  end?: ReactNode;
  /** Shows a live count next to the floated label while focused. Needs `maxLength`. */
  counter?: boolean;
  className?: string;
}

/**
 * aui-029 · Floating label. Signature: the label lifts out of the field and settles into the border,
 * cutting a notch in the hairline, while a brand line sweeps in along the bottom edge.
 */
export function FloatingInput({
  label = "Workspace name",
  hint,
  error,
  start,
  end,
  counter,
  className,
  id: idProp,
  placeholder,
  ...rest
}: FloatingInputProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value ?? "") : inner;
  const msg = error ?? hint;
  const max = rest.maxLength;
  const lift = start
    ? "peer-focus:-translate-x-[26px] peer-[:not(:placeholder-shown)]:-translate-x-[26px]"
    : "";

  return (
    <div className={cx("aui029 w-full", className)}>
      <style href="asta-input-aui-029" precedence="asta">
        {CSS}
      </style>
      <div
        className={cx(
          "group/f relative flex h-14 items-center gap-2.5 rounded-[10px] bg-paper px-3.5 transition-shadow duration-300 ease-[cubic-bezier(.16,1,.3,1)]",
          error
            ? "shadow-[inset_0_0_0_1.5px_var(--color-ink)]"
            : "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)] focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]",
          rest.disabled && "pointer-events-none opacity-50",
        )}
      >
        {start && (
          <span className="flex shrink-0 text-mute transition-colors duration-300 group-focus-within/f:text-ink [&_svg]:h-4 [&_svg]:w-4">
            {start}
          </span>
        )}
        <div className="relative h-full min-w-0 flex-1">
          <input
            id={id}
            {...rest}
            placeholder={placeholder ?? " "}
            aria-invalid={error ? true : rest["aria-invalid"]}
            aria-describedby={msg ? `${id}-msg` : undefined}
            onChange={(e) => {
              if (!controlled) setInner(e.target.value);
              rest.onChange?.(e);
            }}
            className="peer h-full w-full bg-transparent pt-1.5 text-[15px] tracking-[-0.01em] text-ink outline-none placeholder:text-transparent focus:placeholder:text-mute"
          />
          {/* Resting inside the field, floated into the border once focused or filled. The lower half of its
              background is paper, so it cuts a notch in the hairline. */}
          <label
            htmlFor={id}
            className={cx(
              "pointer-events-none absolute -left-1 top-1/2 -mt-[10px] flex h-5 origin-left items-center gap-1.5 whitespace-nowrap px-1 text-[15px] tracking-[-0.01em] text-mute",
              "bg-[linear-gradient(to_bottom,transparent_44%,var(--color-paper)_44%)]",
              "transition-[transform,color] duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
              "peer-focus:-translate-y-[28px] peer-focus:scale-[.8] peer-focus:text-brand",
              "peer-[:not(:placeholder-shown)]:-translate-y-[28px] peer-[:not(:placeholder-shown)]:scale-[.8] peer-[:not(:placeholder-shown)]:text-ink",
              lift,
            )}
          >
            <span className="font-medium">{label}</span>
            {counter && max ? (
              <span className="tabular-nums text-mute opacity-0 transition-opacity duration-300 group-focus-within/f:opacity-100">
                {value.length}/{max}
              </span>
            ) : null}
          </label>
        </div>
        {end && <span className="flex shrink-0 items-center text-[13.5px] text-mute">{end}</span>}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-0 h-px origin-left scale-x-0 bg-brand transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-focus-within/f:scale-x-100"
        />
      </div>
      {msg && (
        <p
          key={error ? "e" : "h"}
          id={`${id}-msg`}
          role={error ? "alert" : undefined}
          className={cx("mt-1.5 flex items-center gap-1.5 pl-1 text-[12.5px] leading-snug", error ? "text-ink" : "text-mute")}
          style={{ animation: "aui029-in .3s cubic-bezier(.16,1,.3,1) both" }}
        >
          {error && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6.25" />
              <path d="M8 4.8v3.6M8 11h.01" />
            </svg>
          )}
          {msg}
        </p>
      )}
    </div>
  );
}

export default FloatingInput;
