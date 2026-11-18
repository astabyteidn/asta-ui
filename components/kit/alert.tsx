"use client";

import { useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-alert-in { from { opacity: 0; transform: translateY(-4px) } }`;

export type AlertTone = "info" | "success" | "warning" | "neutral";

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  /** The message. */
  children?: ReactNode;
  /** A button or link shown under the message. */
  action?: ReactNode;
  /** Replace the icon, or pass `false` to hide it. */
  icon?: ReactNode | false;
  /** Show a close button. */
  dismissible?: boolean;
  /** Called when the close button is pressed. */
  onDismiss?: () => void;
  /** Called once the alert has faded and collapsed. */
  onExited?: () => void;
  /** Controlled visibility. Set it to false to play the exit. */
  open?: boolean;
  className?: string;
}

// Tone is told by the icon shape and the surface, never by hue: blue for info and success, ink for warnings.
const SURFACE: Record<AlertTone, string> = {
  info: "bg-[color-mix(in_srgb,var(--color-brand)_7%,var(--color-paper))]",
  success: "bg-paper-2",
  warning: "bg-paper-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_16%,transparent)]",
  neutral: "bg-paper-2",
};

function ToneIcon({ tone }: { tone: AlertTone }) {
  const common = { viewBox: "0 0 20 20", className: "h-5 w-5", "aria-hidden": true } as const;
  if (tone === "success")
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="8" className="fill-brand" />
        <path d="m6.6 10.2 2.3 2.3 4.5-5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "warning")
    return (
      <svg {...common}>
        <path d="M10 2.8c.5 0 .9.25 1.15.68l6.3 11.1c.5.9-.14 2-1.15 2H3.7c-1 0-1.65-1.1-1.15-2l6.3-11.1c.25-.43.65-.68 1.15-.68z" className="fill-ink" />
        <path d="M10 7.4v4" className="stroke-paper" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1" className="fill-paper" />
      </svg>
    );
  return (
    <svg {...common} fill="none">
      <circle cx="10" cy="10" r="7.6" strokeWidth="1.6" className={tone === "info" ? "stroke-brand" : "stroke-mute"} />
      <path d="M10 9v4.4" strokeWidth="1.7" strokeLinecap="round" className={tone === "info" ? "stroke-brand" : "stroke-mute"} />
      <circle cx="10" cy="6.4" r="1" className={tone === "info" ? "fill-brand" : "fill-mute"} />
    </svg>
  );
}

/**
 * An inline callout for something the reader should know. The tone shows in the icon and surface, not in
 * colour. Dismissing fades it out, then the space it took collapses so the content below glides up.
 */
export function Alert({ tone = "info", title, children, action, icon, dismissible, onDismiss, onExited, open, className }: AlertProps) {
  const [closed, setClosed] = useState(false);
  const [gone, setGone] = useState(false);
  const visible = open ?? !closed;

  // Reopening a controlled alert brings it back.
  if (visible && gone) setGone(false);
  if (gone) return null;

  const finish = () => {
    if (visible) return;
    setGone(true);
    onExited?.();
  };

  return (
    <div
      className="grid transition-[grid-template-rows] delay-150 duration-300 motion-reduce:!delay-0 motion-reduce:!duration-[1ms]"
      style={{ gridTemplateRows: visible ? "1fr" : "0fr", transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <style href="asta-alert" precedence="asta">{KEYFRAMES}</style>
      <div className="min-h-0 overflow-hidden">
        <div
          role={tone === "warning" ? "alert" : "status"}
          className={cx(
            "flex items-start gap-3 rounded-xl px-4 py-3.5 transition-[opacity,transform] duration-200 motion-reduce:!duration-[1ms]",
            "animate-[asta-alert-in_.36s_cubic-bezier(.16,1,.3,1)_backwards] motion-reduce:animate-none",
            visible ? "opacity-100" : "scale-[.98] opacity-0",
            SURFACE[tone],
            className,
          )}
        >
          {icon !== false && <span className="mt-px flex shrink-0 text-ink">{icon ?? <ToneIcon tone={tone} />}</span>}
          <div className="min-w-0 flex-1 pt-px">
            {title && <p className="text-[13.5px] font-medium tracking-[-0.01em] text-ink">{title}</p>}
            {children && <div className={cx("text-[13px] leading-relaxed text-ink-2", !!title && "mt-0.5")}>{children}</div>}
            {action && <div className="mt-2.5 flex flex-wrap items-center gap-2">{action}</div>}
          </div>
          {dismissible && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                if (open === undefined) setClosed(true);
                onDismiss?.();
              }}
              className="-mr-1.5 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-mute outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alert;
