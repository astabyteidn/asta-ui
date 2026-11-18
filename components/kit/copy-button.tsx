"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "ease-[cubic-bezier(.16,1,.3,1)]";

export interface ClipboardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onCopy" | "children"> {
  /** Text to copy, or a function that returns it at click time. */
  value: string | (() => string);
  /** Visible label. Leave it out for an icon-only button. */
  label?: string;
  /** Label while the check shows. */
  copiedLabel?: string;
  /** How long the check stays, in ms. */
  timeout?: number;
  onCopy?: (text: string) => void;
  variant?: "ghost" | "outline" | "soft";
  size?: "sm" | "md";
}

async function writeText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure pages: fall back to a hidden textarea.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {}
    ta.remove();
    return ok;
  }
}

const VARIANT = {
  ghost: "text-mute hover:bg-paper-2 hover:text-ink",
  outline: "text-ink-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_14%,transparent)] hover:text-ink hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_26%,transparent)]",
  soft: "bg-paper-2 text-ink-2 hover:text-ink",
};

/**
 * Copies text on click. The copy icon turns and fades as a check draws itself in, the label rolls to
 * "Copied", and both settle back after a moment. Screen readers hear the result.
 */
export function ClipboardButton({ value, label, copiedLabel = "Copied", timeout = 1600, onCopy, variant = "ghost", size = "md", className, onClick, ...rest }: ClipboardButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const text = typeof value === "function" ? value() : value;
    const ok = await writeText(text);
    setState(ok ? "copied" : "failed");
    if (ok) onCopy?.(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), timeout);
  };

  const done = state === "copied";
  const icon = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const said = done ? copiedLabel : state === "failed" ? "Couldn't copy" : label;

  return (
    <>
    <button
      type="button"
      {...rest}
      aria-label={label ? undefined : (rest["aria-label"] ?? "Copy")}
      data-state={state}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) copy();
      }}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-lg font-medium outline-none transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[.96] disabled:pointer-events-none disabled:opacity-40",
        size === "md" ? "h-9 text-[13px]" : "h-7 text-[12.5px]",
        label ? (size === "md" ? "px-3" : "px-2.5") : size === "md" ? "w-9" : "w-7",
        VARIANT[variant],
        className,
      )}
    >
      <span className={cx("relative flex items-center justify-center", icon)} aria-hidden>
        <svg
          viewBox="0 0 16 16"
          className={cx("absolute inset-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none", EASE, done ? "rotate-[-30deg] scale-50 opacity-0" : "scale-100 opacity-100")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <rect x="5.25" y="5.25" width="8" height="8" rx="2" />
          <path d="M10.75 3.5V3.75A1.75 1.75 0 0 0 9 2H4A2 2 0 0 0 2 4v5a1.75 1.75 0 0 0 1.75 1.75H4" strokeLinecap="round" />
        </svg>
        <svg
          viewBox="0 0 16 16"
          className={cx("absolute inset-0 text-brand transition-[opacity,transform] duration-300 motion-reduce:transition-none", EASE, done ? "scale-100 opacity-100" : "scale-75 opacity-0")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="m3.5 8.5 3 3 6-7"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={done ? 0 : 1}
            className={cx("transition-[stroke-dashoffset] motion-reduce:transition-none", EASE, done ? "delay-75 duration-[420ms]" : "duration-150")}
          />
        </svg>
      </span>
      {label && (
        <span className="relative grid overflow-hidden" aria-hidden>
          {/* Both labels share one cell so the width never jumps. */}
          <span className={cx("col-start-1 row-start-1 transition-[opacity,transform] duration-300 motion-reduce:transition-none", EASE, state === "idle" ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0")}>{label}</span>
          <span className={cx("col-start-1 row-start-1 transition-[opacity,transform] duration-300 motion-reduce:transition-none", EASE, state === "idle" ? "translate-y-full opacity-0" : "translate-y-0 opacity-100")}>
            {state === "failed" ? "Couldn't copy" : copiedLabel}
          </span>
        </span>
      )}
      {label && <span className="sr-only">{label}</span>}
    </button>
    {/* Outside the button so the announcement doesn't become part of its name. */}
    <span className="sr-only" role="status" aria-live="polite">
      {state === "idle" ? "" : said}
    </span>
    </>
  );
}

export default ClipboardButton;
