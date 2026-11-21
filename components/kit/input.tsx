"use client";

import { useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type InputState = "default" | "error" | "success";
export type InputSize = "sm" | "md" | "lg";

const SIZE: Record<InputSize, string> = {
  sm: "h-8 rounded-md px-2.5 text-[16px] sm:text-[13px] gap-2",
  md: "h-10 rounded-lg px-3 text-[16px] sm:text-[14px] gap-2.5",
  lg: "h-12 rounded-[9px] px-4 text-[16px] sm:text-[15px] gap-3",
};

const RING: Record<InputState, string> = {
  default:
    "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] " +
    "focus-within:!shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_4px_color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
  error: "shadow-[inset_0_0_0_1px_#e5484d] focus-within:shadow-[inset_0_0_0_1px_#e5484d,0_0_0_4px_rgb(229_72_77/0.16)]",
  success: "shadow-[inset_0_0_0_1px_#30a46c] focus-within:shadow-[inset_0_0_0_1px_#30a46c,0_0_0_4px_rgb(48_164_108/0.16)]",
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  state?: InputState;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Shows a clear button while there is text. */
  clearable?: boolean;
  /** Extra classes for the outer frame. */
  className?: string;
  inputClassName?: string;
}

const StateIcon = ({ state }: { state: InputState }) =>
  state === "error" ? (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#e5484d]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" />
    </svg>
  ) : state === "success" ? (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#30a46c]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  ) : null;

/** A text input in a frame that holds icons, a clear button and a state. Uncontrolled or controlled. */
export function Input({ size = "md", state = "default", iconLeft, iconRight, clearable, className, inputClassName, ...rest }: InputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const controlled = rest.value !== undefined;
  const [inner, setInner] = useState(String(rest.defaultValue ?? ""));
  const value = controlled ? String(rest.value) : inner;

  const clear = () => {
    const el = ref.current!;
    // Go through the native setter so React's onChange fires for controlled inputs too.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  };

  return (
    <div
      className={cx(
        "group/in relative flex w-full items-center bg-paper text-ink transition-shadow duration-200",
        SIZE[size],
        RING[state],
        rest.disabled && "pointer-events-none opacity-50",
        className,
      )}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          ref.current?.focus();
        }
      }}
    >
      {iconLeft && <span className="flex shrink-0 text-mute transition-colors group-focus-within/in:text-ink [&_svg]:h-4 [&_svg]:w-4">{iconLeft}</span>}
      <input
        ref={ref}
        aria-invalid={state === "error" || undefined}
        {...rest}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          rest.onChange?.(e);
        }}
        className={cx("h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden", inputClassName)}
      />
      {clearable && (
        <button
          type="button"
          tabIndex={value ? 0 : -1}
          aria-label="Clear"
          onClick={clear}
          className={cx(
            "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)] text-ink-2 outline-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:bg-[color-mix(in_srgb,var(--color-ink)_16%,transparent)] focus-visible:ring-2 focus-visible:ring-brand/50",
            value ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0",
          )}
        >
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M3 3l6 6M9 3 3 9" />
          </svg>
        </button>
      )}
      <StateIcon state={state} />
      {iconRight && <span className="flex shrink-0 text-mute [&_svg]:h-4 [&_svg]:w-4">{iconRight}</span>}
    </div>
  );
}

/** Password field with a reveal toggle; the eye's lid blinks shut and open. */
export function PasswordInput(props: Omit<InputProps, "type" | "iconRight">) {
  const [show, setShow] = useState(false);
  return (
    <Input
      name="password"
      autoComplete="current-password"
      autoCapitalize="none"
      spellCheck={false}
      {...props}
      type={show ? "text" : "password"}
      inputClassName={cx(!show && "tracking-[0.12em]", props.inputClassName)}
      iconRight={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="-mr-1 grid h-7 w-7 place-items-center rounded-lg text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <svg viewBox="0 0 16 16" className="!h-4 !w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
            <circle cx="8" cy="8" r="2" className={cx("origin-center transition-transform duration-300", show ? "scale-100" : "scale-0" /* perf-ok: eye pupil */)} />
            <path d="M2.5 13.5l11-11" pathLength={1} strokeDasharray="1" className="transition-[stroke-dashoffset] duration-300 ease-[cubic-bezier(.16,1,.3,1)]" style={{ strokeDashoffset: show ? 1 : 0 }} />
          </svg>
        </button>
      }
    />
  );
}

export default Input;
