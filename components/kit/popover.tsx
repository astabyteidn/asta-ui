"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const KEYFRAMES = `@keyframes asta-popover-in { from { opacity: 0; transform: translate(var(--asta-pop-x, 0), var(--asta-pop-y, 0)) scale(.94) } }
@keyframes asta-popover-out { to { opacity: 0; transform: scale(.97) } }`;

export type PopoverSide = "top" | "right" | "bottom" | "left";
export type PopoverAlign = "start" | "center" | "end";

/** Props to spread on your own trigger when you pass `trigger` as a function. */
export interface PopoverTriggerProps {
  ref: (el: HTMLElement | null) => void;
  onClick: (e: MouseEvent<HTMLElement>) => void;
  "aria-haspopup": "dialog";
  "aria-expanded": boolean;
  "aria-controls": string | undefined;
  "data-state": "open" | "closed";
}

export interface PopoverProps {
  /** A focusable element (it gets the props merged in), or a function that receives the props to spread. */
  trigger: ReactElement | ((props: PopoverTriggerProps, open: boolean) => ReactNode);
  /** Panel content, or a function that gets `close`. */
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Gap between trigger and panel, in px. */
  offset?: number;
  /** Draw a small arrow pointing at the trigger. */
  arrow?: boolean;
  /** Accessible name for the panel. */
  label?: string;
  /** Extra classes for the panel (padding, width). */
  className?: string;
}

const PAD = 8;

// Keeps a ref the trigger already had working after we add ours.
function assignRef(r: Ref<HTMLElement> | undefined, el: HTMLElement | null) {
  if (typeof r === "function") r(el);
  else if (r) (r as { current: HTMLElement | null }).current = el;
}
const OPPOSITE: Record<PopoverSide, PopoverSide> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * A click-to-open panel anchored to its trigger. Pick a side and an alignment; it flips when there is no
 * room and slides to stay on screen. It grows out of the trigger, closes on an outside click, Escape or
 * when focus leaves, and hands focus back to the trigger.
 */
export function Popover({ trigger, children, open, defaultOpen = false, onOpenChange, side = "bottom", align = "center", offset = 8, arrow, label, className }: PopoverProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const [present, setPresent] = useState(isOpen);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const arrowEl = useRef<SVGSVGElement>(null);

  // Stay mounted while the close animation plays.
  if (isOpen && !present) setPresent(true);

  const setOpen = (next: boolean) => {
    if (next === isOpen) return;
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchor?.focus();
  };

  // Position: measure, pick the side (flip if needed), clamp to the viewport, write straight to the DOM.
  useLayoutEffect(() => {
    if (!present || !anchor) return;
    const place = () => {
      const el = panel.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const room: Record<PopoverSide, number> = { top: a.top, bottom: vh - a.bottom, left: a.left, right: vw - a.right };
      const need = side === "top" || side === "bottom" ? h : w;
      let s = side;
      if (room[s] < need + offset + PAD && room[OPPOSITE[s]] > room[s]) s = OPPOSITE[s];
      const vertical = s === "top" || s === "bottom";

      let x: number;
      let y: number;
      if (vertical) {
        x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
        y = s === "bottom" ? a.bottom + offset : a.top - offset - h;
        x = Math.min(Math.max(PAD, x), vw - w - PAD);
      } else {
        y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
        x = s === "right" ? a.right + offset : a.left - offset - w;
        y = Math.min(Math.max(PAD, y), vh - h - PAD);
      }

      // Where the trigger's centre lands on the panel edge: the arrow points there and the panel grows from it.
      const along = vertical ? Math.min(Math.max(14, a.left + a.width / 2 - x), w - 14) : Math.min(Math.max(14, a.top + a.height / 2 - y), h - 14);
      const origin = vertical ? `${along}px ${s === "bottom" ? "0" : "100%"}` : `${s === "right" ? "0" : "100%"} ${along}px`;
      const nudge = { top: ["0", "4px"], bottom: ["0", "-4px"], left: ["4px", "0"], right: ["-4px", "0"] }[s];

      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
      el.style.transformOrigin = origin;
      el.style.setProperty("--asta-pop-x", nudge[0]);
      el.style.setProperty("--asta-pop-y", nudge[1]);
      el.dataset.side = s;

      const ar = arrowEl.current;
      if (ar) {
        const rot = { bottom: 0, top: 180, left: 90, right: -90 }[s];
        ar.style.transform = `rotate(${rot}deg)`;
        // The arrow box is 14×7. Its base overlaps the panel edge by 1px to hide the ring under it.
        ar.style.left = vertical ? `${along - 7}px` : s === "right" ? "-9.5px" : `${w - 4.5}px`;
        ar.style.top = vertical ? (s === "bottom" ? "-6px" : `${h - 1}px`) : `${along - 3.5}px`;
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(panel.current!);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [present, anchor, side, align, offset]);

  // Move focus in on open.
  useEffect(() => {
    if (!isOpen) return;
    const el = panel.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el).focus({ preventScroll: true });
  }, [isOpen]);

  // Outside press closes. Focus stays where the press put it.
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchor?.contains(t)) return;
      if (open === undefined) setInner(false);
      onOpenChange?.(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isOpen, anchor, open, onOpenChange]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    // Not modal: tabbing past either end closes and goes back to the trigger.
    const items = [...panel.current!.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (!items.length || (e.shiftKey && (at === first || at === panel.current)) || (!e.shiftKey && at === last)) {
      e.preventDefault();
      close();
    }
  };

  const triggerProps: PopoverTriggerProps = {
    ref: setAnchor,
    onClick: () => setOpen(!isOpen),
    "aria-haspopup": "dialog",
    "aria-expanded": isOpen,
    "aria-controls": present ? id : undefined,
    "data-state": isOpen ? "open" : "closed",
  };

  let triggerNode: ReactNode;
  if (typeof trigger === "function") triggerNode = trigger(triggerProps, isOpen);
  else if (isValidElement<{ onClick?: (e: MouseEvent<HTMLElement>) => void; ref?: Ref<HTMLElement> }>(trigger)) {
    const own = trigger.props;
    triggerNode = cloneElement(trigger, {
      ...triggerProps,
      ref: (el: HTMLElement | null) => {
        setAnchor(el);
        assignRef(own.ref, el);
      },
      onClick: (e: MouseEvent<HTMLElement>) => {
        own.onClick?.(e);
        if (!e.defaultPrevented) setOpen(!isOpen);
      },
    });
  }

  return (
    <>
      {triggerNode}
      {present &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            data-state={isOpen ? "open" : "closed"}
            onKeyDown={onKey}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && !isOpen) setPresent(false);
            }}
            className={cx(
              "fixed left-0 top-0 z-50 w-max max-w-[calc(100vw-16px)] rounded-xl bg-paper p-3 text-ink outline-none",
              "shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-ink)_10%,transparent),0_14px_36px_-14px_rgb(0_0_0/0.3),0_4px_10px_-6px_rgb(0_0_0/0.12)]",
              "animate-[asta-popover-in_.24s_cubic-bezier(.16,1,.3,1)_both] data-[state=closed]:animate-[asta-popover-out_.12s_cubic-bezier(.16,1,.3,1)_both]",
              "motion-reduce:![animation-duration:1ms]",
              className,
            )}
          >
            <style href="asta-popover" precedence="asta">{KEYFRAMES}</style>
            {arrow && (
              <svg ref={arrowEl} width="14" height="7" viewBox="0 0 14 7" aria-hidden className="pointer-events-none absolute" style={{ transformOrigin: "50% 50%" }}>
                <path d="M0 7 7 .8 14 7z" className="fill-paper" />
                <path d="M0 7 7 .8 14 7" fill="none" strokeWidth="1" style={{ stroke: "color-mix(in srgb, var(--color-ink) 12%, transparent)" }} />
              </svg>
            )}
            {typeof children === "function" ? children({ close: () => close() }) : children}
          </div>,
          document.body,
        )}
    </>
  );
}

export default Popover;
