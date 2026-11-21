"use client";

import { Dialog as D } from "radix-ui";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row at the bottom. */
  footer?: ReactNode;
  /** Keep the overlay inside the nearest positioned parent instead of the whole viewport. */
  contained?: boolean;
  className?: string;
}

/**
 * A modal on Radix Dialog that grows out of whatever opened it (the focused element when `open` turns true)
 * and shrinks back into it on close. Radix traps focus, closes on Escape or a click outside, hides the rest
 * of the page from screen readers and locks scrolling; focus goes back to the trigger afterwards.
 * Put `data-autofocus` on the field that should take focus first.
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, contained = false, className }: DialogProps) {
  // Stays mounted through the exit animation, so Radix gets `forceMount` and we unmount ourselves.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const fromTrigger = () => {
    const p = panel.current?.getBoundingClientRect();
    const t = opener.current?.getBoundingClientRect();
    if (!p || !t || !t.width) return "translateY(12px) scale(.96)";
    const dx = t.left + t.width / 2 - (p.left + p.width / 2);
    const dy = t.top + t.height / 2 - (p.top + p.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${Math.max(0.15, t.width / p.width)}, ${Math.max(0.1, t.height / p.height)})`;
  };
  const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Enter: grow out of the trigger. Layout effects run before Radix moves focus, so the active element is the opener.
  useLayoutEffect(() => {
    if (!open || !panel.current) return;
    const p = panel.current;
    if (!p.contains(document.activeElement)) opener.current = document.activeElement as HTMLElement | null;
    const from = still() ? "none" : fromTrigger();
    p.animate([{ transform: from, opacity: 0, borderRadius: "999px" }, { transform: "none", opacity: 1, borderRadius: "24px" }], { duration: 520, easing: EASE });
    backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
  }, [open]);

  // Exit: shrink back into the trigger, then unmount (Radix returns focus via onCloseAutoFocus).
  useEffect(() => {
    if (open || !mounted) return;
    const p = panel.current;
    if (!p || still()) return setMounted(false);
    backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out", fill: "forwards" });
    const a = p.animate([{ transform: "none", opacity: 1 }, { transform: fromTrigger(), opacity: 0 }], { duration: 280, easing: EASE, fill: "forwards" });
    a.onfinish = () => setMounted(false);
    return () => {
      a.onfinish = null;
    };
  }, [open, mounted]);

  if (!mounted) return null;

  const layer = (
    <div className={cx(contained ? "absolute" : "fixed", "inset-0 z-50 flex items-center justify-center p-4")}>
      <D.Overlay forceMount ref={backdrop} className={cx("absolute inset-0 bg-[rgb(10_10_10/0.38)] will-change-[opacity]", contained && "rounded-[inherit]")} />
      <D.Content
        forceMount
        ref={panel}
        // No description: tell Radix on purpose, so it doesn't warn.
        {...(description ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          const p = panel.current;
          const first = p?.querySelector<HTMLElement>("[data-autofocus]") ?? p?.querySelector<HTMLElement>(FOCUSABLE);
          (first ?? p)?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          opener.current?.focus({ preventScroll: true });
          opener.current = null;
        }}
        className={cx(
          "relative max-h-full w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-2xl bg-paper p-6 outline-none",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_24px_60px_-20px_rgb(0_0_0/0.45)]",
          className,
        )}
      >
        <D.Close
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-mute outline-none transition-colors hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </D.Close>
        <D.Title className="pr-8 text-[18px] font-medium tracking-[-0.02em] text-ink">{title}</D.Title>
        {description && <D.Description className="mt-1.5 text-[14px] leading-relaxed text-mute">{description}</D.Description>}
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </D.Content>
    </div>
  );

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {contained ? layer : <D.Portal forceMount>{layer}</D.Portal>}
    </D.Root>
  );
}

export default Dialog;
