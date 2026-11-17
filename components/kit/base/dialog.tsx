"use client";

import { Dialog as D } from "@base-ui/react/dialog";
import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";

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

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A modal on Base UI Dialog that grows out of whatever opened it (the focused element when `open` turns true)
 * and shrinks back into it on close. Base UI traps focus, closes on Escape or a click outside, hides the rest
 * of the page from screen readers and locks scrolling; focus goes back to the trigger afterwards.
 * Put `data-autofocus` on the field that should take focus first.
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, contained = false, className }: DialogProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const host = useRef<HTMLSpanElement>(null);

  const fromTrigger = useCallback(() => {
    const p = panel.current?.getBoundingClientRect();
    const t = opener.current?.getBoundingClientRect();
    if (!p || !t || !t.width) return "translateY(12px) scale(.96)";
    const dx = t.left + t.width / 2 - (p.left + p.width / 2);
    const dy = t.top + t.height / 2 - (p.top + p.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${Math.max(0.15, t.width / p.width)}, ${Math.max(0.1, t.height / p.height)})`;
  }, []);

  // Remember the opener before Base UI moves focus into the dialog.
  useLayoutEffect(() => {
    if (open && !panel.current?.contains(document.activeElement)) opener.current = document.activeElement as HTMLElement | null;
  }, [open]);

  // Enter: grow out of the trigger as soon as the popup is in the DOM.
  const attach = useCallback(
    (el: HTMLDivElement | null) => {
      panel.current = el;
      if (!el || !el.hasAttribute("data-open")) return;
      el.animate([{ transform: still() ? "none" : fromTrigger(), opacity: 0, borderRadius: still() ? "24px" : "999px" }, { transform: "none", opacity: 1, borderRadius: "24px" }], { duration: still() ? 160 : 520, easing: EASE });
      backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
    },
    [fromTrigger],
  );

  // Exit: shrink back into the trigger. Base UI waits for this animation before it unmounts the popup.
  useLayoutEffect(() => {
    const p = panel.current;
    if (open || !p || still()) return;
    backdrop.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" });
    p.animate([{ transform: "none", opacity: 1 }, { transform: fromTrigger(), opacity: 0 }], { duration: 320, easing: "cubic-bezier(.7,0,.84,0)", fill: "forwards" });
  }, [open, fromTrigger]);

  return (
    <>
      {contained && <span ref={host} className="contents" />}
      <D.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
        <D.Portal container={contained ? host : undefined}>
          <div className={cx(contained ? "absolute" : "fixed", "inset-0 z-50 flex items-center justify-center p-4")}>
            <D.Backdrop ref={backdrop} className={cx("absolute inset-0 bg-[rgb(10_10_10/0.38)] will-change-[opacity]", contained && "rounded-[inherit]")} />
            <D.Popup
              ref={attach}
              initialFocus={() => {
                const p = panel.current;
                return p?.querySelector<HTMLElement>("[data-autofocus]") ?? p?.querySelector<HTMLElement>(FOCUSABLE) ?? p ?? true;
              }}
              finalFocus={() => {
                const back = opener.current;
                opener.current = null;
                return back && back.isConnected ? back : true;
              }}
              className={cx(
                "relative w-full max-w-[400px] rounded-2xl bg-paper p-6 outline-none",
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
            </D.Popup>
          </div>
        </D.Portal>
      </D.Root>
    </>
  );
}

export default Dialog;
