"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useRef, type ReactElement, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export interface FieldProps {
  label: ReactNode;
  /** Help text under the input. Replaced by the error while there is one. */
  hint?: ReactNode;
  /** An error message. Each time it changes to a new message the field shakes once. */
  error?: ReactNode;
  required?: boolean;
  /** Shown on the right of the label, e.g. "Optional" or a character count. */
  aside?: ReactNode;
  className?: string;
  /** Any single input-like element. It receives `id`, `aria-describedby`, `aria-invalid` and `aria-required`. */
  children: ReactElement<Record<string, unknown>>;
}

/** Label, hint and error around any input, wired up for screen readers. */
export function Field({ label, hint, error, required, aside, className, children }: FieldProps) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const last = useRef<ReactNode>(null);

  // Shake once per new error message (Web Animations, so the input keeps focus).
  useEffect(() => {
    if (error && error !== last.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrap.current?.animate(
        [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
        { duration: 420, easing: "cubic-bezier(.36,.07,.19,.97)" },
      );
    }
    last.current = error ?? null;
  }, [error]);

  const child = Children.only(children);
  const msgId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const input = isValidElement(child)
    ? cloneElement(child, {
        id: (child.props.id as string) ?? id,
        "aria-describedby": msgId,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
      })
    : child;
  const inputId = (child.props.id as string) ?? id;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-[13px] font-medium tracking-[-0.01em] text-ink">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-[#e5484d]">
              *
            </span>
          )}
        </label>
        {aside && <span className="text-[12px] tabular-nums text-mute">{aside}</span>}
      </div>
      <div ref={wrap}>{input}</div>
      <div className="grid text-[12.5px] leading-snug">
        {error ? (
          <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-[#e5484d] animate-[kit-field-in_.3s_cubic-bezier(.16,1,.3,1)_both]">
            <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3.5M8 11h0" />
            </svg>
            {error}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-mute">
            {hint}
          </p>
        ) : null}
      </div>
      <style>{`@keyframes kit-field-in { from { opacity: 0; transform: translateY(-3px) } to { opacity: 1; transform: none } }`}</style>
    </div>
  );
}

/** A plain text input styled to match the kit, with error styling driven by `aria-invalid`. */
export const fieldInputClass =
  "h-10 w-full rounded-lg bg-paper px-3 text-[14px] text-ink outline-none placeholder:text-mute " +
  "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-shadow duration-200 " +
  "hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_24%,transparent)] " +
  "focus:shadow-[inset_0_0_0_1px_var(--color-brand),0_0_0_3px_color-mix(in_srgb,var(--color-brand)_18%,transparent)] " +
  "aria-[invalid=true]:shadow-[inset_0_0_0_1px_#e5484d,0_0_0_3px_rgb(229_72_77/0.14)]";

export default Field;
