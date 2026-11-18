"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const EASE = "cubic-bezier(.16,1,.3,1)";
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type DrawerSide = "right" | "left" | "bottom";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which edge the sheet slides in from. */
  side?: DrawerSide;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row pinned to the bottom of the sheet. */
  footer?: ReactNode;
  /** Keep the overlay inside the nearest positioned parent instead of the whole viewport. */
  contained?: boolean;
  /** Bottom sheets can be dragged down to close. Set false to turn that off. */
  draggable?: boolean;
  className?: string;
}

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const offscreen = (side: DrawerSide) =>
  side === "right" ? "translateX(calc(100% + 16px))" : side === "left" ? "translateX(calc(-100% - 16px))" : "translateY(calc(100% + 16px))";

/**
 * A side sheet that slides in from the right, the left or the bottom over a fading overlay. Escape or a click
 * on the overlay closes it, Tab stays inside while it's open, and focus goes back to whatever opened it.
 * Bottom sheets have a handle you can drag down to dismiss. Put `data-autofocus` on the field that should
 * take focus first.
 */
export function Drawer({ open, onOpenChange, side = "right", title, description, children, footer, contained = false, draggable = true, className }: DrawerProps) {
  // Stays mounted through the exit animation, then unmounts itself.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const uid = useId();
  const panel = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const drag = useRef<{ y: number; t: number; dy: number; v: number } | null>(null);

  // Enter: slide in and take focus. Layout effect, so the active element is still the opener.
  useLayoutEffect(() => {
    const p = panel.current;
    if (!open || !p) return;
    if (!p.contains(document.activeElement)) opener.current = document.activeElement as HTMLElement | null;
    const first = p.querySelector<HTMLElement>("[data-autofocus]") ?? p.querySelector<HTMLElement>(`[data-body] ${FOCUSABLE}`) ?? p;
    first.focus({ preventScroll: true });
    // Reopened mid-exit: drop the exit animation and any leftover drag offset.
    for (const el of [p, overlay.current]) {
      el?.getAnimations().forEach((a) => a.cancel());
      el?.style.removeProperty(el === p ? "transform" : "opacity");
    }
    if (still()) return;
    p.animate([{ transform: offscreen(side) }, { transform: "none" }], { duration: 560, easing: EASE });
    overlay.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: EASE });
  }, [open, side]);

  // Exit: slide out from wherever the sheet is (a drag may have moved it), then unmount and return focus.
  useEffect(() => {
    if (open || !mounted) return;
    const p = panel.current;
    if (!p) return;
    const from = getComputedStyle(p).transform;
    const ms = still() ? 0 : 340;
    overlay.current?.animate([{ opacity: getComputedStyle(overlay.current).opacity }, { opacity: 0 }], { duration: ms, easing: EASE, fill: "forwards" });
    const a = p.animate([{ transform: from === "none" ? "none" : from }, { transform: offscreen(side) }], { duration: ms, easing: EASE, fill: "forwards" });
    a.onfinish = () => {
      setMounted(false);
      opener.current?.focus({ preventScroll: true });
      opener.current = null;
    };
    return () => {
      a.onfinish = null;
    };
  }, [open, mounted, side]);

  // Lock page scroll while a viewport drawer is up.
  useEffect(() => {
    if (!mounted || contained) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, contained]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onOpenChange(false);
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return e.preventDefault();
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Drag to close (bottom sheet): the sheet and the overlay follow the pointer, no re-renders.
  const canDrag = side === "bottom" && draggable;
  const onDragStart = (e: PointerEvent<HTMLDivElement>) => {
    if (!canDrag || e.button !== 0 || !open) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0, v: 0 };
    panel.current?.getAnimations().forEach((a) => a.cancel());
  };
  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const p = panel.current;
    if (!d || !p) return;
    const raw = e.clientY - d.y;
    // Pulling up resists, pulling down follows 1:1.
    const dy = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
    d.v = (dy - d.dy) / Math.max(1, e.timeStamp - d.t);
    d.t = e.timeStamp;
    d.dy = dy;
    p.style.transform = `translateY(${dy}px)`;
    if (overlay.current) overlay.current.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / p.offsetHeight));
  };
  const onDragEnd = () => {
    const d = drag.current;
    const p = panel.current;
    drag.current = null;
    if (!d || !p) return;
    if (d.dy > p.offsetHeight * 0.3 || d.v > 0.6) return onOpenChange(false);
    const from = p.style.transform;
    p.style.transform = "";
    if (overlay.current) overlay.current.style.opacity = "";
    if (!still()) p.animate([{ transform: from || "none" }, { transform: "none" }], { duration: 420, easing: EASE });
  };

  if (!mounted || typeof document === "undefined") return null;

  const bottom = side === "bottom";
  const layer = (
    <div className={cx(contained ? "absolute" : "fixed", "inset-0 z-50 overflow-hidden", contained && "rounded-[inherit]")}>
      <div ref={overlay} aria-hidden onClick={() => onOpenChange(false)} className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_28%,transparent)] will-change-[opacity]" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={description ? `${uid}-desc` : undefined}
        tabIndex={-1}
        onKeyDown={onKey}
        className={cx(
          "absolute flex flex-col overflow-hidden rounded-[14px] bg-paper outline-none will-change-transform",
          "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_8%,transparent),0_24px_64px_-24px_color-mix(in_srgb,var(--color-ink)_45%,transparent)]",
          side === "right" && "inset-y-2 right-2 w-[min(400px,calc(100%-48px))]",
          side === "left" && "inset-y-2 left-2 w-[min(400px,calc(100%-48px))]",
          bottom && "inset-x-2 bottom-2 mx-auto max-h-[calc(100%-56px)] max-w-[520px]",
          className,
        )}
      >
        {bottom && (
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            aria-hidden
            className={cx("flex shrink-0 justify-center pb-1 pt-2.5 [touch-action:none]", canDrag && "cursor-grab active:cursor-grabbing")}
          >
            <span className="h-1 w-9 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_16%,transparent)]" />
          </div>
        )}
        <div className={cx("flex shrink-0 items-start justify-between gap-4 px-5", bottom ? "pt-2" : "pt-5")}>
          <div className="min-w-0">
            <h2 id={`${uid}-title`} className="text-[16px] font-medium tracking-[-0.02em] text-ink">
              {title}
            </h2>
            {description && (
              <p id={`${uid}-desc`} className="mt-1 text-[13.5px] leading-relaxed text-mute">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mute outline-none transition-colors duration-200 hover:bg-paper-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div data-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
          {children}
        </div>
        {footer && <div className="flex shrink-0 flex-col-reverse gap-2 px-5 pb-5 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );

  return contained ? layer : createPortal(layer, document.body);
}

export default Drawer;
